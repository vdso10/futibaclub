const express = require('express')
const app = express.Router()
const db = require('./db')

const init = db =>{

    app.use((req, res, next) => {
        (!req.session.user) ? res.redirect('/') : next()
    })

    app.get('/', async (req, res) => {

        const conn = await db
        const [ rows, fields ] = await conn.query('SELECT groups.id, groups.name, group_users.role FROM `futiba-club`.groups left join group_users on groups.id = group_users.group_id and group_users.user_id = ?',
        [
            req.session.user.id
        ])
            res.render('groups', {
            groups: rows
        })
    })

    app.post('/', async (req, res) => {

        const conn = await db
        const [ insertedId, insertedFields] = await conn.query('insert into `futiba-club`.groups (name) values (?)', [
            req.body.name
        ])

        await conn.query("insert into `futiba-club`.group_users (group_id, user_id, role) values (?, ?, ?)", [
            insertedId.insertId,
            req.session.user.id,
            'owner'
        ])
        
        res.redirect('/groups')
    })

    //solictar para entrar no grupo
    app.get('/:id/join', async (req, res) => {

        const conn = await db
        const [ rows, fields ] = await conn.query('select * from group_users where user_id = ? and group_id = ?',
            [
            req.session.user.id,
            req.params.id
        ])
        if(rows.length > 0){
            res.redirect('/groups')
        } else {
            await conn.query('insert into group_users (group_id, user_id, role) values (?,?,?)',
            [
                req.params.id,
                req.session.user.id,
                'pending'
            ])            
            res.redirect('/groups')            
        }
    })

    //mostar situação dos grupos e jogos
    app.get('/:id', async (req, res) => {

        const conn = await db
        const [group] = await conn.query('select groups.id, groups.name, group_users.role from `futiba-club`.groups left join `futiba-club`.group_users on group_users.group_id = groups.id and group_users.user_id = ? where groups.id = ?',
        [
            req.session.user.id,
            req.params.id
        ])
        const [pendings] = await conn.query('select group_users.id, group_users.user_id, group_users.group_id, group_users.role, users.name from `futiba-club`.group_users inner join `futiba-club`.users on group_users.user_id = users.id and group_users.group_id = ? and group_users.role like "pending"',
        [
            req.params.id
        ])
        
        const [games] = await conn.query('select games.id, games.team_a, games.team_b, games.result_a, games.result_b, guessings.result_a as guess_a, guessings.result_b as guess_b, guessings.score from `futiba-club`.games left join `futiba-club`.guessings on games.id = guessings.game_id and guessings.user_id = ? and guessings.group_id = ?',        
        [
        
            req.session.user.id,
            req.params.id
        ])
        
        res.render('group', {
            pendings,
            group: group[0],
            games
        })
    })

    //librando entrado no grupo
    app.get('/:id/pending/:idGU/:op', async (req, res) =>{

        const conn = await db
        const [group] = await conn.query('select * from `futiba-club`.groups left join group_users on group_users.group_id = groups.id and group_users.user_id = ? where groups.id = ?',
        [
            req.session.user.id,
            req.params.id
        ])        
        if(group.length === 0 || group[0].role !== 'owner'){
            res.redirect('/groups/'+req.params.id)
        } else {
            if(req.params.op === 'yes'){
                await conn.query('update group_users set role = "user" where id = ? limit 1',
                [
                    req.params.idGU
                ])
                res.redirect('/groups/'+req.params.id)
            } else {
                await conn.query('delete from group_users where id = ? limit 1',
                [
                    req.params.idGU
                ])
                res.redirect('/groups/'+req.params.id)
            }
        }
    })

    //salvando os palpites
    app.post('/:id', async (req, res) => {

        const conn = await db
        const guessings = []
        Object
            .keys(req.body)
            .forEach( team => {
                const parts = team.split('_')
                const game = {
                    game_id: parts[1],
                    result_a: req.body[team].a,
                    result_b: req.body[team].b
                }
                guessings.push(game)
            })
        const batch = guessings.map(guess =>{
            return conn.query('insert into guessings (result_a, result_b, game_id, group_id, user_id) values (?,?,?,?,?)',
            [
                guess.result_a,
                guess.result_b,
                guess.game_id,
                req.params.id,
                req.session.user.id
            ])
        })
        await Promise.all(batch)
        res.redirect('/groups/'+req.params.id)
    })        

    return app
       
}

module.exports = init