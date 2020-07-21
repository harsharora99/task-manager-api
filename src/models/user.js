const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task=require('../models/task')

const userSchema = new mongoose.Schema({ //model 'User' created 
    name: {
        type: String,
        required: true,
        trim: true //trims spaces
    },
    age: {
        type: Number,
        default: 0, //sets default value
        validate(value) {
            if (value < 0) {
                throw new Error('Age must be a positive number')
            }
        }
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 7,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('Password cannot contain "password"')
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type:Buffer
    }
  },
    {
    timestamps:true
})

userSchema.virtual('mytasks', {   //sets a vitual property which is not really saved in the database as its other properties
    ref: "Task",               //reference
    localField: "_id",
    foreignField: "owner"
})

//methods are accesible on instances
//statics are accesible on models
userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET) 
    user.tokens = user.tokens.concat({ token })  //add token for current session to the tokens list of the user
    await user.save()    //save the updated user to the database
    return token
}


userSchema.methods.toJSON = function () {   //this function is called implicitly before converting object to json the instance to database
    const user = this                         //using this function,only the information which can be publically shared is sent back to the current session user
    const userObject = user.toObject() //object with only data(without mongoose functions like save)

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar
    return userObject
}

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email })
    if (!user) {
        throw new Error('Unable to login')
    }
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
        throw new Error('Unable to login')
    }
    return user

}

//hash the plain text password before saving
userSchema.pre('save', async function (next) {
    const user = this   //this function runs just before saving a user

    if (user.isModified('password')) {
        user.password=await bcrypt.hash(user.password,8)
    }
    
    next()
})

//delete user tasks when user is removed
userSchema.pre('remove', async function (next) {
    const user = this
    await Task.deleteMany({owner:user._id})

    next()
}) 

const User = mongoose.model('User', userSchema)

module.exports=User