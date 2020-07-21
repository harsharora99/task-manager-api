const mongoose = require('mongoose')  //this file defines the task model
const bcrypt = require('bcryptjs')



const taskSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
        trim: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
}, {
    timestamps:true
})
taskSchema.pre('save', async function (next) {
    const task = this //this function runs just before saving a user
    
    if (task.isModified('password')) {
        task.password = await bcrypt.hash(task.password, 8)
    }
    next()
})

const Task = mongoose.model('Task', taskSchema)

module.exports=Task