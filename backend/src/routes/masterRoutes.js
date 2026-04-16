const express = require('express');
const router = express.Router();
const c = require('../controllers/masterController');
const { authenticateToken } = require('../middleware/auth');

// Item Categories
router.get('/categories', authenticateToken, c.getCategories);
router.post('/categories', authenticateToken, c.createCategory);
router.put('/categories/:id', authenticateToken, c.updateCategory);
router.delete('/categories/:id', authenticateToken, c.deleteCategory);

// Item Subcategories
router.get('/subcategories', authenticateToken, c.getSubcategories);
router.post('/subcategories', authenticateToken, c.createSubcategory);
router.put('/subcategories/:id', authenticateToken, c.updateSubcategory);
router.delete('/subcategories/:id', authenticateToken, c.deleteSubcategory);

// Item Types
router.get('/types', authenticateToken, c.getTypes);
router.post('/types', authenticateToken, c.createType);
router.put('/types/:id', authenticateToken, c.updateType);
router.delete('/types/:id', authenticateToken, c.deleteType);

// Currencies
router.get('/currencies', authenticateToken, c.getCurrencies);
router.post('/currencies', authenticateToken, c.createCurrency);
router.put('/currencies/:id', authenticateToken, c.updateCurrency);
router.delete('/currencies/:id', authenticateToken, c.deleteCurrency);

// HSN Codes
router.get('/hsn', authenticateToken, c.getHsnCodes);
router.post('/hsn', authenticateToken, c.createHsnCode);
router.put('/hsn/:id', authenticateToken, c.updateHsnCode);
router.delete('/hsn/:id', authenticateToken, c.deleteHsnCode);

// UOM
router.get('/uom', authenticateToken, c.getUom);
router.post('/uom', authenticateToken, c.createUom);
router.put('/uom/:id', authenticateToken, c.updateUom);
router.delete('/uom/:id', authenticateToken, c.deleteUom);

module.exports = router;
