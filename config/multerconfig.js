const multer = require("multer");
const path = require("path");
const crypto = require("crypto")

//diskstorage

//VID NO-21
const storage = multer.diskStorage({
    //setting up file folder

    destination: function (req, file, cb) {
        cb(null, './public/images/uploads')   //yha pe file upload hogiiii
    },
    
    //setting up filename

    filename: function (req, file, cb) {
        //now we are creating a random names for our file to avoid file override.
        crypto.randomBytes(12, function (err, name) {
            
            //extname -extension name, fn- file namepath.extname(file.originalname) maanlo humare file ka naam h "abcd.jpeg" , to extname kya krega ki is file ke extension ko nikaal lega(mtlb is pure expression se hume "jpeg" ans milega)

            const fn = name.toString("hex") + path.extname(file.originalname)    

            cb(null,fn)

        })
        
    }
})

const upload = multer({ storage: storage })
module.exports= upload










/*

//VID NO-20
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/images/uploads')   //yha pe file upload hogiiii
    },
    filename: function (req, file, cb) {
        crypto.randomBytes(12, function (err, bytes) {
            const fn = bytes.toString("hex") + path.extname(file.originalname)    //extname -extension name, fn- file name
            //path.extname(file.originalname) maanlo humare file ka naam h "abcd.jpeg" , to extname kya krega ki is file ke extension ko nikaal lega(mtlb is pure expression se hume "jpeg" ans milega)
            cb(null,fn)

        })
        
    }
})

const upload = multer({ storage: storage })


app.get("/test", (req, res) => {
    res.render("test")
})

app.post("/upload",upload.single('image'), (req, res) => {
    console.log(req.file);
    
})

*/