const express = require('express')
const app = express.Router()
const db = require('./db')

const init = db => {
    
    
    app.get('/', async (req, res) =>{
    
        const conn = await db
        const [rows, fields] = await conn.query('SELECT * FROM users');
        //console.log(rows)

        res.render('home')
    })

    app.get('/logout', (req, res)=>{
        req.session.destroy( err => {
            res.redirect('/')
        })
    })


    app.get('/login', (req, res) =>{
        res.render('login', { error: false })
    })

    app.post('/login', async (req, res) => {

        const conn = await db
        const[rows, fields] = await conn.query('select * from users where email = ?', [req.body.email])
        if(rows.length === 0){
            res.render('login', {error: 'Usuário e/ou Senha inválidos.'})
        }else{
            if(rows[0].passwd === req.body.passwd){
                const userDb = rows[0]
                const user = {
                    id: userDb.id,
                    name: userDb.name,
                    role: userDb.role
                }
                req.session.user = user
                res.redirect('/')
                
            } else {
                res.render('login', { error: 'Usuário e/ou senha inválidos.'})
            }
        }
    })

    
    app.get('/new-account', (req, res) => {
        res.render('new-account', {error: false})
    })
    
    app.post('/new-account', async (req, res) =>{
        const conn = await db
        const [rows, fields] = await conn.query('SELECT * FROM users where email = ?', [req.body.email]);

        if(rows.length === 0){
            const { name, email, passwd } = req.body
            const [inserted, insertedFields] = await conn.query('insert into users (name, email, passwd, role) values(?,?,?,?)', [
                name, email, passwd, 'user'
            ])

            const user = {
                id: inserted.insertId,
                name: name,
                role: 'user'
            }
            req.session.user = user

            res.redirect('/new-account')

        }else{
            console.log('deu erro')
            res.render('new-account', {
                
               error: 'Usuário ja existe!'
            })
        }

    })

    return app
}

module.exports = init