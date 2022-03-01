const express = require('express')
const app = express()

const bodyParser = require('body-parser')
const session = require('express-session')

const account = require('./account');
const db = require('./db');
const admin = require('./admin')
const groups = require('./groups')



const init = async () => {

    const conn = await db
   

app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true }))
app.set('view engine', 'ejs')
app.use(session({
    secret: 'estudar-node',
    saveUninitialized: true,
    resave: true
}))

    //criando sessão
    app.use((req, res, next) => {
        if(req.session.user){
            
            res.locals.user = req.session.user
        }else{

            res.locals.user = false
        }
        next()
    })


    app.use(account(db))
    app.use('/admin', admin(db))
    app.use('/groups', groups(db))

    let classification = null
    app.get('/classification', async (req, res) =>{
        if(classification){
            res.render('classification', { ranking: classification})
        } else {
            const sql = ' select users.id, users.name, sum(guessings.score) as score from users left join guessings on guessings.user_id = users.id group by users.id order by score DESC'

            const [rows] = await conn.query(sql)
            classification = rows
            res.render('classification', { ranking: rows})
        }
    } )

    app.listen(3000, err => console.log('Futiba Club is running...'))

}
init()