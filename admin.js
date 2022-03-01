const express = require('express')
const app = express.Router()
const db = require('./db')

const init = db =>{

    app.use((req, res, next) => {
        (!req.session.user || req.session.user.role === 'user') ? res.redirect('/') : next()
    })

    app.get('/', (req, res) => {
        res.send('Ola admin')
    })

    app.get('/games', async (req, res) => {
        
        const conn = await db
        const [rows, fields] = await conn.query('select * from games')
        res.render('admin/games', {
            games: rows
        })
    })

    app.post('/games', async (req, res) => {

        const conn = await db
        const { team_a, team_b } = req.body
        await conn.query('insert into games (team_a, team_b) values (?,?)', [team_a, team_b])
        res.redirect('/admin/games')
    })
    
    //salvando os resultados dos jogos e palpites e calculando a pontuação
    app.post('/games/results', async (req, res) => {

        const conn = await db
        const games = []
        Object
            .keys(req.body)
            .forEach( team => {
                const parts = team.split('_')
                const game = {
                    game_id: parseInt(parts[1]),
                    result_a: parseInt(req.body[team].a),
                    result_b: parseInt(req.body[team].b)
                }
                games.push(game)
            })        
            for(let i=0; i<games.length; i++){
                const game = games[i]
                const [guessings] = await conn.query('select * from guessings where game_id = ?', [
                    game.game_id
                ])
                const batch = guessings.map(guess => {
                    let score = 0
                    if(guess.result_a === game.result_a && guess.result_b === game.result_b){
                        score = 100
                    } else {
                        if(guess.result_a === game.result_a || guess.result_b === game.result_b){
                            score += 25
                            if(guess.result_a < guess.result_b && game.result_a < game.result_b){
                                score += 25
                            }
                            if(guess.result_a > guess.result_b && game.result_a > game.result_b){
                                score += 25
                            }                                
                        }
                    }          
                    return conn.query('update guessings set score = ? where id = ?', [
                        score,
                        guess.id
                    ])
                })
                await Promise.all(batch)
                await conn.query('update games set result_a = ?, result_b = ? where id = ?', [
                    game.result_a,
                    game.result_b,
                    game.game_id
                ])
            }
            res.redirect('/admin/games')            
    })
    app.get('/games/delete/:id', async (req, res) => {
        
        const conn = await db
        await conn.query('delete from games where id = ? limit 1', [
            req.params.id
        ])
        res.redirect('/admin/games')
    })

    return app
}

module.exports = init