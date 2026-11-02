const express = require('express');
const { Router } = require('express');

const orderController = require('../../controllers/blueboxx/order.controller');
const { notifyOrder, notifyTestUser } = require('../../controllers/blueboxx/notify.controller');
const { getOrdersBySiteRange } = require('../../controllers/blueboxx/order.range.controller');
const { getDashboardSeries } = require('../../controllers/blueboxx/order.dashboard.controller');
const { getOrdersBySiteDay } = require('../../controllers/blueboxx/order.bySite.controller');
// const requireAuth = require('../middleware/auth');
const { updateOrderStatus } = require('../../controllers/blueboxx/order.status.controller');
const { sendOrderAcceptedEmail, sendOrderPreparedEmail } = require('../../controllers/blueboxx/email.controller');
const { getOrderForPrint } = require('../../controllers/blueboxx/order.print.controller');

const router = Router();

router.get('/', (req, res) => res.json({ message: 'Order API root' }));

router.get('/dashboard', getDashboardSeries)
router.get('/by-site/range', getOrdersBySiteRange);
router.get('/by-site/day', getOrdersBySiteDay);
router.post('/notify', notifyOrder);
router.post('/notify-test', notifyTestUser);
router.post('/accepted-email', sendOrderAcceptedEmail);
router.post('/prepared-email', sendOrderPreparedEmail);
router.get('/:orderId/print', getOrderForPrint);
router.patch('/:id/status', express.json(), updateOrderStatus);


module.exports = router;
