// const mongoose = require('mongoose')
// const mongoURI = process.env.MONGODB_URL;
// mongoose.connect(mongoURI)

// const userSchema = mongoose.Schema({
//     username : String,
//     name : String,
//     age : Number,
//     email : String,
//     password : String,
//     profilepic:{
//         type:String,
//         default:"default.jpg"
//     },
//     posts:[
//         {
//             type:mongoose.Schema.Types.ObjectId, ref :"post"
//         }
//     ]
   
// })


// module.exports = mongoose.model('user',userSchema)

const mongoose = require('mongoose');
require('dotenv').config();
const mongoURI = process.env.MONGODB_URL;

// Connect to MongoDB without deprecated options
mongoose.connect(mongoURI)
.then(() => console.log('Connected to MongoDB Atlas'))
.catch(err => console.error('MongoDB connection error:', err));

const userSchema = mongoose.Schema({
    username: String,
    name: String,
    age: Number,
    email: String,
    password: String,
    profilepic: {
        type: String,
        default: "default.jpg"
    },
    posts: [
        {
            type: mongoose.Schema.Types.ObjectId, ref: "post"
        }
    ]
});

module.exports = mongoose.model('user', userSchema);
