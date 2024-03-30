class AppError extends Error { //extending native builtin error
    constructor(message, status){
        super();
        this.message = message;
        this.status = status;
    }
}

module.exports = AppError;