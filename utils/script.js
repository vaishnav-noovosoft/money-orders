const userList = document.getElementById('fromUserDeposit');
const userListArray = Array.prototype.slice.call(userList);

fetch('http://localhost:3000/api/users')
.then(res=>{
    res.json()
})
.then(userNames =>{
    userListArray.forEach((user))=>{

    }
})