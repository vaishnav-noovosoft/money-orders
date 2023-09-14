// const HOST = 'http://localhost:3000';
//
// document.getElementById('deposit-form').addEventListener('submit' ,async (e) =>{
//     e.preventDefault();
//     console.log("dfdf");
//     const data={
//         "toUser": document.getElementById('fromUserDeposit').value,
//         "amount": document.getElementById('amountDeposit').value,
//         "role":"admin"
//     }
//     await fetch(HOST+'/api/transaction?type=deposit',{
//         method: "POST",
//         headers: {
//             "Content-Type" : "application/json",
//             "authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozLCJ1c2VybmFtZSI6InB1bGtpdCIsInBhc3N3b3JkIjoiJDJiJDA4JFJRS2N6OWRSVjViRmtRMVcxSG5ybmV5NWZWZWh6MDNDQUJBb0R3THRURmtJZGoxQTNaRHh5Iiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjk0NjAyMzcyLCJleHAiOjE2OTQ2ODg3NzJ9.BlmnPJPsiR18xvFRVZmDuhWVBCumst7dj-_07atBvHU"
//         },
//         body: JSON.stringify(data)
//
//     }).then(res=>{
//         console.log('Deposit Successful')
//     })
// });
//
