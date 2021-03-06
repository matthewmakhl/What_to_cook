const router = require('express').Router();
const knex = require('knex')({
    client: 'pg',
    connection: {
        host: process.env.RDS_ENDPOINT,
        database: process.env.RDS_DB_NAME,
        user: process.env.RDS_USERNAME,
        password: process.env.RDS_PASSWORD
    }
});

class groupService {
    //create a group
    create(req, res, newName, userId) {
        this.query = knex.select('*').from('groups').where('groups', newName);
        this.query.then((group) => {
            //check duplicate
            if (group.length === 1) {
                req.flash('error_msg', 'The username has been taken. Be creative!')
            } else {
                //add group
                console.log('adding group')
                knex("groups").insert(
                    {
                        groups: newName
                    }
                ).then(() => {
                    //pair up the creater and group
                    this.query2 = knex.select('*').from('groups').where('groups', newName).then((NewGroup) => {
                        console.log(userId)
                        knex("groupsusers").insert({
                            userid: userId,
                            groupid: NewGroup[0].id
                        }).then(() => {
                            res.redirect('/lobby')
                        })
                    })
                })
            }
        })
    }
    //end of create a group

    //get group
     get(req, res, groupid, userid, displayName) {
        let tempRecipe
        let myArray = []
        this.query = knex.select('*').from('chat').where('groupid', groupid).rightOuterJoin('users', 'users.id', 'chat.userid')
        this.query2 = knex.select('recipe').from('groupsrecipes').where('groupid', groupid).orderBy('id','ASC').then((data)=>{
            tempRecipe = data;
            for (let i of data){
                myArray.push(i.recipe)
            }          
        }).then(
        this.query.then((chatrecord) => {
            console.log(myArray);
            res.render('chatroom', { 
                userid: userid, 
                chatrecord: chatrecord, 
                groupid: groupid, 
                displayName: displayName,
                user:req.user,
                no_need_logo:true,
                chatroom:true,
                tempRecipe:myArray
            });
            myArray = []
        })
        )
    }

    //invite group
    invite(req, res, username, groupid) {
        this.query = knex.select('id').from('users').where('userName', username);
        this.query.then((userid) => {
            if (userid.length == 1) {
                // add relationship
                console.log('user found')
                console.log(groupid)
                var invitedUser = userid[0].id;
                console.log(invitedUser)
                knex("groupsusers").insert({
                    userid: invitedUser,
                    groupid: groupid
                }).then(() => {
                    res.redirect('/group/chat/' + groupid);
                })
            } else {
                //no user found
                console.log('no user found');
                req.flash('error_msg', 'User not found')
                res.redirect('/group/chat/' + groupid);
            }
        }
        )

    }

    addReceipt(req, res, recipe, group) {
        
        for (let item of recipe){
            console.log(item)
            knex('groupsrecipes').insert(
                {
                groupid:group[0].groupid,
                recipe: item
                }
            ).then(()=>{})
        }
    }
}

module.exports = groupService