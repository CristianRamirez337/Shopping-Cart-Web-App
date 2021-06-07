let mongoose = require('mongoose')
mongoose.set("useCreateIndex", true);
const bcrypt = require("bcryptjs");

var UserSchema = new mongoose.Schema({
    name: {type: String, required: [true, 'A name for the user is needed'], unique: true},
    email: {type: String, required: [true, 'An email is required '], unique: true},
    password: { type: String, required: [true, 'A password is needed']},
    avatar: {data: Buffer, contentType: String}
});

UserSchema.pre("save", function (next) {
    const user = this

    if (this.isModified("password") || this.isNew) {
        bcrypt.genSalt(10, function (saltError, salt) {
            if (saltError) {
                return next(saltError)
            } else {
                bcrypt.hash(user.password, salt, function(hashError, hash) {
                    if (hashError) {
                        return next(hashError)
                    }

                    user.password = hash
                    next()
                })
            }
        })
    } else {
        return next()
    }
})

module.exports = mongoose.model('UsersModel', UserSchema);