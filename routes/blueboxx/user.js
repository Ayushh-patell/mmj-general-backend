const { Router } = require('express');
const { createUser, listUsers, updateUser } = require('../../controllers/blueboxx/user.controller');
const { login } = require('../../controllers/blueboxx/auth.controller');
const { accountSetup } = require('../../controllers/blueboxx/account.controller');
const { addToken } = require('../../controllers/blueboxx/fcm.controller');
const { resetPasswordAfterRecovery, sendRecoveryCode, verifyRecoveryCode } = require('../../controllers/blueboxx/recovery.controller');
const { logoutController } = require('../../controllers/blueboxx/logout.controller');

const router = Router();

router.get('/', (req, res) => res.json({ message: 'User API root' }));
router.get('/list', listUsers);
router.post('/create', createUser);
router.patch('/update', updateUser);
router.post('/login', login);
router.post('/addToken', addToken);
router.post('/logout', logoutController);

router.post('/account/setup', accountSetup);
router.post('/account/recovery/send-code', sendRecoveryCode);
router.post('/account/recovery/verify', verifyRecoveryCode);
router.post('/account/recovery/reset', resetPasswordAfterRecovery);

module.exports = router;