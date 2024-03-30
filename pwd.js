const bcrypt = require('bcrypt')

// const hashPassword = async (pw) =>{
//     const salt = await bcrypt.genSalt(10);
//     const hash = await bcrypt.hash(pw, salt);
//     console.log(salt);
//     console.log(hash);
// }

const hashPassword = async (pw) =>{
    const hash = await bcrypt.hash(pw, 12);
    console.log(hash);
}

const login = async(pwd, hashedPw)=>{
    const result = await bcrypt.compare(pwd, hashedPw) // result true or false
    if(result){
        console.log("LOGGED YOU IN! SUCCESSFUL MATCH!")
    } else {
        console.log("INCORRECT!")
    }
}

login('monkey', '$2b$10$muJ95wz6hZ4F8Na1eRnas.Z2eLKxpyYDnRB3gETxHPuyOnx28MhBu')