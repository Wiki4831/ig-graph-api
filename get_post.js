const client = require('node-fetch');
var fs = require('fs');
const data = require('./usernamedata/filtered_username_athlete.json');
const error=require('./User_Post/Error_list.json')
const lasttime = require('./User_Post/Lasttime.json');
const abort=require('./User_Post/abort_list.json')

/*

Base GET url:https://graph.facebook.com/v13.0/17841451297953988?fields=business_discovery.username(username){username,website,name,ig_id,id,profile_picture_url,biography,follows_count,followers_count,media_count,media{id,caption,like_count,comments_count,timestamp,username,media_product_type,media_type,owner,permalink,media_url,children{media_url}}}&&access_token={access_token}
AfterPAGE GET url:https://graph.facebook.com/v13.0/17841451297953988?fields=business_discovery.username(username){username,website,name,ig_id,id,profile_picture_url,biography,follows_count,followers_count,media_count,media.after(after_cursor){id,caption,like_count,comments_count,timestamp,username,media_product_type,media_type,owner,permalink,media_url,children{media_url}}}&access_token={access_token}

*/

const targetusernamelist = JSON.parse(JSON.stringify(data));
var errorlist=JSON.parse(JSON.stringify(error));
var abortlist=JSON.parse(JSON.stringify(abort));

const useraccountid=17841451297953988;
const accest_token='EAAthJeNbSZBABAF0HMxZA5XF5ZA3xZAfcHSo01SQm0xgtuVYJ92tuZA2roqgk9gNJEnMsvbV28AXmyjpsgU16FtrbGSyqAhZAMcIguOOdhW4zEReB23iQsEVSmEh9AYtcn2lIY5WkDrhMtaZCFhMdGltKMEjoQjO7ws8izqfFZBaWQZDZD'

var i=lasttime.num;
var lastcursor=lasttime.aftercursor;
var lasttimedone=lasttime.DONE;

var peoplecount=84;
var limitreached=false;

getinfo();

async function getinfo(){
        for(i;i<peoplecount+1;i++){
            if(lasttimedone){
                console.log('----------New Person----------');
                console.log(targetusernamelist[i].username);
                if(targetusernamelist[i].post_count<=25){
                    continue;
                }
                var postlist=new Array();
                const resp = await client('https://graph.facebook.com/v13.0/'+useraccountid+'?fields=business_discovery.username('+targetusernamelist[i].username+'){username,website,name,ig_id,id,profile_picture_url,biography,follows_count,followers_count,media_count,media{id,caption,like_count,comments_count,timestamp,username,media_product_type,media_type,owner,permalink,media_url,children{media_url}}}&access_token='+accest_token, {
                method: 'GET'
                });//get first page
                const data = await resp.json();
                if(data.error){
                    if(data.error.code==4){
                        console.log('----------Limited Reached----------');
                        let errordata={
                            num:i,
                            aftercursor:null,
                            DONE:true
                        }
                        let str = JSON.stringify(errordata,"","\t");
                        fs.writeFile('./User_Post/Lasttime.json',str,function(err){
                        })
                        break;
                    }
                    console.log('----------ERROR----------');
                    errorlist.push(i);
                    let str = JSON.stringify(errorlist,"","\t");
                    console.log(data);
                    fs.writeFile('./User_Post/Error_list.json',str,function(err){
                    })
                    continue;
                }
                postlist.push(data.business_discovery.media.data);
                var cursor=data.business_discovery.media.paging.cursors;
            }
            else{
                console.log('----------Last Person----------');
                console.log(targetusernamelist[i].username);
                var postlist=new Array();
                var cursor={
                    after:lastcursor
                }
                lasttimedone=true;
            }
            while(cursor.after){//get after page
                const resp = await client('https://graph.facebook.com/v13.0/'+useraccountid+'?fields=business_discovery.username('+targetusernamelist[i].username+'){username,website,name,ig_id,id,profile_picture_url,biography,follows_count,followers_count,media_count,media.after('+cursor.after+'){id,caption,like_count,comments_count,timestamp,username,media_product_type,media_type,owner,permalink,media_url,children{media_url}}}&access_token='+accest_token, {
                method: 'GET'
                });
                const data = await resp.json();
                if(data.error){
                    console.log('----------Limited Reached----------');
                    console.log(data);
                    let errordata={
                        num:i,
                        aftercursor:cursor.after,
                        DONE:false
                    }
                    let str = JSON.stringify(errordata,"","\t");
                    fs.writeFile('./User_Post/Lasttime.json',str,function(err){
                    })
                    limitreached=true;
                    abortlist.push(i);
                    str = JSON.stringify(abortlist,"","\t");
                    fs.writeFile('./User_Post/abort_list.json',str,function(err){
                    })
                    break;
                }
                postlist.push(data.business_discovery.media.data);
                cursor=data.business_discovery.media.paging.cursors;
            }
            console.log(i);
            let str = JSON.stringify(postlist,"","\t");
            fs.appendFile('./User_Post/'+i+'_'+targetusernamelist[i].username+'.json',str,function(err){
            })
            if(limitreached){
                console.log('-----------ABORT----------');
                break;
            }
            console.log('----------DONE----------');
            if(i==peoplecount){
                let errordata={
                    num:peoplecount,
                    aftercursor:null,
                    DONE:true,
                    ALLDONE:true
                }
                let str = JSON.stringify(errordata,"","\t");
                fs.writeFile('./User_Post/Lasttime.json',str,function(err){
                })
            }
        }
    };

function getRandom(min,max){
    return Math.floor(Math.random()*(max-min+1))+min;
};
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }