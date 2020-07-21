const mongoose = require('mongoose')   //file for connecting to mongodb database


mongoose.connect(process.env.MONGODB_URL, {          //connects to data-base task-manager
    useNewUrlParser: true,
    useCreateIndex:true    
})

