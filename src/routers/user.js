const express = require('express')
const multer=require('multer')
const sharp=require('sharp')
const User = require('../models/user.js')    //importing user model
const auth=require('../middleware/auth.js')
const {sendWelcomeEmail,sendCancelationEmail}=require('../emails/account')

const router = new express.Router()



router.post('/users', async (req, res) => {
    const user = new User(req.body)   //creating an instance of User model

    try {
        await user.save()       //saving user instance into database
        sendWelcomeEmail(user.email,user.name)
        const token = await user.generateAuthToken()       //generate a token for current session
         //if this line throws an error(promise is not fullfilled) then directly catch is runned skipping any further lines in try
        res.status(201).send({ user, token })
    } catch (e) {
        res.status(400).send(e)
    }
})


router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email,req.body.password)
        const token=await user.generateAuthToken()
        res.send({   //stringify is called by express to convert to json
            user,
            token
        })
    }
    catch (e) {
        res.status(400).send()
    }
})



router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
           return token.token!==req.token
        })
        await req.user.save()
       
        res.send()
    } catch(e){
        res.status(500).send()
    } 
})

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})


router.get('/users/me', auth, async (req, res) => {   //auth is middleware
    res.send(req.user)
})


router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ["name", "email", "password", "age"]

    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({
            error: 'Invalid updates!'
        })
    }
    try {
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()
        res.send(req.user)
    } catch (e) {
        res.status(400).send(e)
    }

})


router.delete('/users/me', auth, async (req, res) => { //runs only if the user is authentiated
    try {
        await req.user.remove()
        sendCancelationEmail(req.user.email,req.user.name)
        res.send(req.user)
    } catch (e) {
        res.status(500).send(e)
    }
})



const upload = multer({
    
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload an image file'))
        }
        cb(undefined, true)
    }

})


router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({
        error: error.message
    })
})

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if(!user || !user.avatar){
            throw new Error()
        }
        res.set('Content-Type','image/png')
        res.send(user.avatar)
        
    } catch (e) {
        res.status(404).send()
    }
})



module.exports=router