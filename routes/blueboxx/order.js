import express from 'express';
import { Router } from 'express';

import * as orderController from '../../controllers/blueboxx/order.controller.js';
import { notifyOrder, notifyTestUser } from '../../controllers/blueboxx/notify.controller.js';
import { getOrdersBySiteRange } from '../../controllers/blueboxx/order.range.controller.js';
import { getDashboardSeries } from '../../controllers/blueboxx/order.dashboard.controller.js';
import { getOrdersBySiteDay } from "../../controllers/blueboxx/order.bySite.controller.js";
// import { requireAuth } from '../middleware/auth.js';
import { updateOrderStatus } from '../../controllers/blueboxx/order.status.controller.js';
import { sendOrderAcceptedEmail, sendOrderPreparedEmail } from '../../controllers/blueboxx/email.controller.js';
import { getOrderForPrint } from '../../controllers/blueboxx/order.print.controller.js';

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


export default router;
