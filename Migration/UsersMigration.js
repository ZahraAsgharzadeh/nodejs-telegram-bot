
// Create table users query 
exports.createUsersTable = function(){
    let query = "CREATE TABLE users (id INT AUTO_INCREMENT PRIMARY KEY, first_name VARCHAR(255),user_id VARCHAR(255) NOT NULL,username VARCHAR(255),warningCount INT,addMemberCount INT NOT NULL) ;";
    return query;
};

// Get users table is exists
exports.usersExists = function() {
    const query = "SELECT * FROM information_schema.tables WHERE table_schema = 'TelegramAdminDB' AND table_name = 'users';";
    return query;
};