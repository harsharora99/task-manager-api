const express = require('express')              //main file
require('./db/mongoose') //this ensures that connection is made to the mongodb database

const userRouter=require('./routers/user.js')
const taskRouter=require('./routers/task.js')

const app = express()

const port=process.env.PORT

app.use(express.json()) //configure express server to parse incoming json to object which gets sent from client side 
app.use(userRouter)  //registering the router with the app present in seperate file
app.use(taskRouter)



app.listen(port, () => {
    return console.log('Server is up on port ' + port)
})

