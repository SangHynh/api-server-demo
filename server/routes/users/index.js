const express = require('express');
const router = express.Router();
const userController = require('../../controllers/user.controller');

router.post('/', userController.createUser); 
router.get('/', userController.getAllUsers);   
router.get('/:id', userController.getUserById);  
router.put('/:id', userController.updateUser);   
router.delete('/:id', userController.deleteUser); 
router.get('/user-info/:zaloId', userController.getUserInfo);

module.exports = router;
