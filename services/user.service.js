const getRelationship = (self, user) => {
    if (self._id.toString() === user._id.toString()){
        return 'self';
    }

    for(const i of self.friends){
        if (i._id.toString() === user._id.toString()){
            return 'friend';
        }
    }

    for(const i of self.friend_requests){
        if (i._id.toString() === user._id.toString()){
            return 'accept';
        }
    }

    for(const i of user.friend_requests){
        if (i._id.toString() === self._id.toString()){
            return 'sent';
        }
    }

    return 'stranger';
}

module.exports = {
    getRelationship
}