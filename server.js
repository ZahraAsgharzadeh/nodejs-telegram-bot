
// Telegraf library => https://telegraf.js.org/#/
const Telegraf = require('telegraf');

// Create your bot object with your token which you received from https://t.me/botfather
const bot = new Telegraf('YOUR BOT TOKEN');

// Use mysql data base for some features
const mysql = require('mysql');

// Config data base
const DBConfig = require('../telegramAdminBot/DataBaseConfig');

// Migration for user table
const usersMigration = require('../telegramAdminBot/Migration/UsersMigration');

// Queries for users table
const users = require('../telegramAdminBot/users');

// Create mysql connection to data base
mysqlConnection = mysql.createConnection(DBConfig);

// Connect bot to data base 
mysqlConnection.connect(function(error) {
   if (error) throw error;
   console.log('Mysql database connected!');
  
   mysqlConnection.query(usersMigration.usersExists() , function (error, result) {
      if (error) throw error;

      if (result[0] == undefined) {
        // users table is not created yet, let's create it 
        mysqlConnection.query(usersMigration.createUsersTable(), 
        function(error, result) {
          if (error) throw error;
          console.log('users table created with this result: ' + result.message);
        });
      };
    });
});

// Calls when new member joined chat
bot.on('new_chat_members', (ctx) => {
    

    // Current chat id 
    const chat_id = ctx.message.chat.id;
    // User id 
    const user_id = ctx.message.new_chat_members[0].id;
    // User message id
    const message_id = ctx.message['message_id'];
    // Get user that add new member if exists, if user is joined id is the user id,
    // if user is added by another user, added by id is that id
    const added_by_id = ctx.message.from.id;

    // User if added by another member
    if (added_by_id != user_id) {
      mysqlConnection.query(users.isUserCreated(added_by_id), function(error, user){
        if (error) throw error;
        if (user.length != 0) {
          const add_member_count = user[0].addMemberCount + 1;
          mysqlConnection.query(users.addMemberCountForUser(added_by_id, add_member_count), function(error, result){
            if (error) throw error;
            // Update user with new add member count
            if (user[0].addMemberCount < 2) {
              const usersToAdd = 2 - user[0].addMemberCount;
              ctx.reply('You should add just ' + `${usersToAdd} members to unlock your accunt 😌`)
            }
          });
        }
      });
    }

    // Remove join messages
    removeMessage(chat_id, message_id);

    // Check if user type is bot or no
    if (ctx.message.new_chat_members[0].is_bot) {
      // Remove user if it's bot
      bot.telegram.kickChatMember(chat_id, user_id);
      // Remove (bot user removed from group) message
      return removeMessage(chat_id, message_id);
   }

    // Check if user exists or no ?
    mysqlConnection.query(users.isUserCreated(user_id), function(error, result) {
      if (error) throw error;
      if (result.length == 0){
        // User not exists, so create user
        mysqlConnection.query(users.createUser(ctx.message.new_chat_members[0].first_name,
          ctx.message.new_chat_members[0].username,user_id), function(error, result) {
            if (error) throw error;
            console.log('User created successfully ! ');
          });
      };
    });

    var mention = "";
    // Some users don't have a username
    if (ctx.message.new_chat_members[0].username != undefined) {
        mention = "@"+ctx.message.new_chat_members[0].username;
    }
    
    const welcomeText = 'Dear '+`${ctx.message.new_chat_members[0].first_name}` + "💛 \n" + 
    "Welcome to "+ `${ctx.message.chat.title} ` + "group 🌼 " + 
    '\n'+ mention ;

    return ctx.telegram.sendMessage(chat_id, welcomeText);
})

// Calls when a member left chat
bot.on('left_chat_member', (ctx) => {
    const user_id = ctx.message.left_chat_member.id;
    const first_name = ctx.message.left_chat_member.first_name;
    const group_name = ctx.message.chat.title;

    // Delete user from data base
    mysqlConnection.query(users.deleteUser(user_id), function(error, result) {
      if (error) throw error;
      console.log('User deleted successfully !');
    });

    // Remove message 
    return ctx.telegram.sendMessage(user_id,'Hi "'+`${first_name}` 
    + '✋🏻🙁🤚🏻 \n why did you live us on chat '+ `${group_name}?🥺`);
})

// Calls when user sends sticker in chat
bot.on('sticker', (ctx) => {
    const chat_id = ctx.message.chat.id;
    
    return ctx.telegram.sendMessage(chat_id,'Cool, If you want more stickers try @sticker inline bot 😎');
})

// Calls when user sends hashtag in chat
bot.hashtag('#bot_description', (ctx) => {
    const chat_id = ctx.message.chat.id;
    const message_id = ctx.message['message_id'];
    return ctx.telegram.sendMessage(chat_id, 'Hi, I am admin bot to control your actions in this group to prevent unwanted actions and messages for other users and admins . I can help you in your groups, just add me to your groups 😁🥳', message_id);
});

bot.hashtag('#group_rules', (ctx) => {
  const chat_id = ctx.message.chat.id;
  const message_id = ctx.message['message_id'];

  return ctx.telegram.sendMessage(chat_id, '- Do not send links and websites\n- If you are mute and can not send any message, add 5 members to unmute your account and activity\n- ', message_id);
});

// Calls when new text message sends to group 
bot.on('message', (ctx) => {
    const message_text = ctx.message.text;
    const message_id = ctx.message['message_id'];
    const chat_id = ctx.message.chat.id;
    const user_id = ctx.message.from.id;

    if (message_text != undefined) {
      pinMessagesOfAdmin(ctx);

      /* Check if user sends unwanted messages, delete it and add a warning for user 
      in data base, if warnings are equals to a custom number for example here I 
      put maximum warning count to 20 . */
      
      // Check user is allowed to send messages in chat or no 
      // Get user information from data base
        mysqlConnection.query(users.isUserCreated(user_id), function(error, result) {
          if (error) throw error;

          if (result.length != 0) {
            // User found in data base, So get user information
            var warning_count = result[0].warningCount ;
            const add_member_count = result[0].addMemberCount;
            
            /* First of all check if user is allowed or no, in this sample project I define an add member count
            for user , So every user joined chat can't send message to chats until they add members 
            to chat that check here . */

            if (add_member_count < 1) {
              const userCount = 2 - add_member_count;
              // User is not allowed to send messages. delete message
              ctx.reply('You can not send message to group until you add '+ `${userCount}` +' members to chat .');
              return removeMessage(chat_id, message_id);
            };

            if (warning_count == 2) {
              ctx.reply('You are not allowed to send messages to this group, If it is force, Contact admins .');
              return removeMessage(chat_id, message_id);
            }

            // If a message contains important text pin it 
            if (message_text.includes("important")) {
              bot.telegram.pinChatMessage(chat_id, message_id).then(_ => {
                return
              });
            }

            // You can add your limitation here for every message in chat
          if(message_text.includes("http://") || message_text.includes("https://")
          || message_text.includes("www.") || message_text.includes("t.me/") ){
    
            // Check user's warning count from data base
            if (error) throw error;
            if (result.length != 0) {
              warning_count = result[0].warningCount + 1;

              // Add warning count for user if user send limited messages
              mysqlConnection.query(users.addWarningForUser(user_id, warning_count), function(error, result) {
                if (error) throw error;
                if (warning_count == 2) {
                  ctx.reply('You reached your limitaion , You will be restrict to learn respect rules 😠 .');
                  muteUser(chat_id, user_id);
                }else {
                  ctx.reply('You did not pay attention to rules, you have new warning.\n If your warnings reach 20 you will be banned and remove from this chat .\n Your warning count till now => ' + `${warning_count}`);
                }
                return removeMessage(chat_id, message_id)

              });
            }   
          };
        }  
      });
    }
})

// Remove message function
function removeMessage(chat_id, message_id){
    bot.telegram.deleteMessage(chat_id, message_id).then(_ => {
        return
    })
}

// Mute a user function
function muteUser(chat_id, user_id){
  bot.telegram.restrictChatMember(chat_id, user_id).then (_ => {
    return
  });
};

// Pin admin messages
function pinMessagesOfAdmin(ctx){
    const message_id = ctx.message['message_id']
    const chat_id = ctx.message.chat.id;

    var userRole = "";

    // Get use status (Creator , ...)
    bot.telegram.getChatMember(chat_id, ctx.message.from.id).then(ctx => {
        userRole = ctx.status;
        if (userRole == 'creator' || userRole == 'Administrator') {
            bot.telegram.pinChatMessage(chat_id, message_id).then(_ => {
                return
            })
        }
    })
}

bot.launch();