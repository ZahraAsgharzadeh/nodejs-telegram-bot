

// Create new user 
exports.createUser = function(first_name, username, user_id) {
    const query = "INSERT INTO users (first_name, user_id, username, warningCount, addMemberCount) VALUES ('"+first_name+"','"+user_id+"','"+username+"',0,0);";
    return query;
}

// Check if user exists 
exports.isUserCreated = function(user_id) {
    const query = "SELECT * FROM users WHERE user_id = "+user_id+" LIMIT 1 ;";
    return query;
};

// Delete user 
exports.deleteUser = function(user_id) {
    const query = "DELETE FROM users WHERE user_id = "+user_id+";";
    return query;
}

// Add warning for user
exports.addWarningForUser = function(user_id, warning_count) {
    const query = "UPDATE users SET warningCount="+warning_count+" WHERE user_id="+user_id+";";
    return query;
}

// Add member count for user
exports.addMemberCountForUser = function(user_id, add_member_count){
    const query = "UPDATE users SET addMemberCount="+add_member_count+" WHERE user_id="+user_id+";";
    return query;
}