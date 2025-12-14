import { Router } from 'express';
import { autocompleteController } from '../controllers';
import { authenticate } from '../middleware/auth';
import { uploadSingleImage } from '../middleware/upload';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @openapi
 * /autocomplete/medical-conditions:
 *   get:
 *     tags: [Autocomplete]
 *     summary: Get medical condition suggestions
 *     description: |
 *       AI-powered autocomplete for medical conditions. Returns relevant medical condition
 *       suggestions based on the user's input query. Useful for form autocompletion when
 *       adding new medical conditions.
 *
 *       The AI considers:
 *       - Condition names (both medical terminology and common names)
 *       - ICD-10 codes
 *       - Condition categories (Cardiovascular, Respiratory, etc.)
 *       - Synonyms and alternative names
 *     parameters:
 *       - name: query
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Search query (minimum 2 characters)
 *         example: "diab"
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 10
 *         description: Maximum number of suggestions to return
 *       - name: context
 *         in: query
 *         schema:
 *           type: string
 *         description: Optional context to improve suggestions (e.g., patient age, symptoms)
 *     responses:
 *       200:
 *         description: List of medical condition suggestions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     suggestions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: "Type 2 Diabetes Mellitus"
 *                           description:
 *                             type: string
 *                             example: "A chronic metabolic disorder characterized by high blood sugar levels due to insulin resistance"
 *                           category:
 *                             type: string
 *                             example: "Endocrine"
 *                           icdCode:
 *                             type: string
 *                             example: "E11"
 *                           synonyms:
 *                             type: array
 *                             items:
 *                               type: string
 *                             example: ["T2DM", "Adult-onset diabetes", "Non-insulin-dependent diabetes"]
 *                     query:
 *                       type: string
 *                       example: "diab"
 *                     hasMore:
 *                       type: boolean
 *                       example: true
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.get('/medical-conditions', autocompleteController.getMedicalConditions.bind(autocompleteController));

/**
 * @openapi
 * /autocomplete/medications:
 *   get:
 *     tags: [Autocomplete]
 *     summary: Get medication suggestions
 *     description: |
 *       AI-powered autocomplete for medications. Returns relevant medication suggestions
 *       based on the user's input query. Searches both generic names and brand names.
 *
 *       The AI provides:
 *       - Generic and brand names
 *       - Drug classification
 *       - Common dosages
 *       - Available forms (tablet, capsule, etc.)
 *     parameters:
 *       - name: query
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Search query (minimum 2 characters)
 *         example: "lisi"
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 10
 *         description: Maximum number of suggestions to return
 *       - name: context
 *         in: query
 *         schema:
 *           type: string
 *         description: Optional context (e.g., condition being treated)
 *     responses:
 *       200:
 *         description: List of medication suggestions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     suggestions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: "Lisinopril"
 *                           genericName:
 *                             type: string
 *                             example: "Lisinopril"
 *                           brandNames:
 *                             type: array
 *                             items:
 *                               type: string
 *                             example: ["Prinivil", "Zestril"]
 *                           drugClass:
 *                             type: string
 *                             example: "ACE Inhibitor"
 *                           commonDosages:
 *                             type: array
 *                             items:
 *                               type: string
 *                             example: ["5mg", "10mg", "20mg", "40mg"]
 *                           forms:
 *                             type: array
 *                             items:
 *                               type: string
 *                             example: ["tablet"]
 *                     query:
 *                       type: string
 *                       example: "lisi"
 *                     hasMore:
 *                       type: boolean
 *                       example: false
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.get('/medications', autocompleteController.getMedications.bind(autocompleteController));

/**
 * @openapi
 * /autocomplete/allergies:
 *   get:
 *     tags: [Autocomplete]
 *     summary: Get allergy/allergen suggestions
 *     description: |
 *       AI-powered autocomplete for allergies and allergens. Returns relevant allergy
 *       suggestions based on the user's input query.
 *
 *       Covers multiple allergy types:
 *       - Drug allergies (Penicillin, Sulfa drugs, NSAIDs, etc.)
 *       - Food allergies (Peanuts, Shellfish, Milk, etc.)
 *       - Environmental allergies (Pollen, Dust mites, Pet dander, etc.)
 *       - Other allergies (Latex, Insect stings, etc.)
 *
 *       The AI also provides:
 *       - Common reactions
 *       - Cross-reactivities (important for drug allergies)
 *     parameters:
 *       - name: query
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Search query (minimum 2 characters)
 *         example: "peni"
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 10
 *         description: Maximum number of suggestions to return
 *       - name: context
 *         in: query
 *         schema:
 *           type: string
 *         description: Optional context (e.g., reaction type)
 *     responses:
 *       200:
 *         description: List of allergy suggestions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     suggestions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: "Penicillin"
 *                           type:
 *                             type: string
 *                             enum: [drug, food, environmental, insect, latex, other]
 *                             example: "drug"
 *                           commonReactions:
 *                             type: array
 *                             items:
 *                               type: string
 *                             example: ["Rash", "Hives", "Anaphylaxis", "Swelling"]
 *                           crossReactivities:
 *                             type: array
 *                             items:
 *                               type: string
 *                             example: ["Amoxicillin", "Ampicillin", "Cephalosporins (10% cross-reactivity)"]
 *                     query:
 *                       type: string
 *                       example: "peni"
 *                     hasMore:
 *                       type: boolean
 *                       example: true
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.get('/allergies', autocompleteController.getAllergies.bind(autocompleteController));

/**
 * @openapi
 * /autocomplete/scan-medicine:
 *   post:
 *     tags: [Autocomplete]
 *     summary: Scan medicine photo to prefill medication form
 *     description: |
 *       AI-powered medicine photo scanner. Upload a photo of a medicine (pill bottle,
 *       medicine box, prescription label, blister pack) and get extracted medication
 *       information to prefill the medication form.
 *
 *       **Supported images:**
 *       - Pill bottles with labels
 *       - Medicine boxes/packaging
 *       - Prescription labels
 *       - Blister packs with medication info
 *
 *       **Extracted information includes:**
 *       - Medication name (brand and generic)
 *       - Dosage and strength
 *       - Recommended frequency
 *       - Form (tablet, capsule, syrup, etc.)
 *       - Manufacturer
 *       - Active ingredients
 *       - Usage instructions and warnings
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Medicine image file (JPEG, PNG, WebP, HEIC)
 *     responses:
 *       200:
 *         description: Successfully extracted medication information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     medicationName:
 *                       type: string
 *                       example: "Lisinopril"
 *                     genericName:
 *                       type: string
 *                       example: "Lisinopril"
 *                     brandName:
 *                       type: string
 *                       example: "Zestril"
 *                     dosageAmount:
 *                       type: string
 *                       example: "10mg"
 *                     frequency:
 *                       type: string
 *                       enum: [once_daily, twice_daily, three_times_daily, four_times_daily, as_needed, weekly, monthly, other]
 *                       example: "once_daily"
 *                     form:
 *                       type: string
 *                       example: "tablet"
 *                     strength:
 *                       type: string
 *                       example: "10mg per tablet"
 *                     manufacturer:
 *                       type: string
 *                       example: "AstraZeneca"
 *                     activeIngredients:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Lisinopril dihydrate"]
 *                     instructions:
 *                       type: string
 *                       example: "Take one tablet daily with or without food"
 *                     warnings:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["May cause dizziness", "Avoid potassium supplements"]
 *                     expiryDate:
 *                       type: string
 *                       example: "2025-12"
 *                     confidence:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 1
 *                       example: 0.85
 *                     notes:
 *                       type: string
 *                       example: "ACE inhibitor for blood pressure control"
 *       400:
 *         description: Invalid image or could not extract information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Could not identify medication from the image. Please ensure the image clearly shows the medicine label."
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.post(
  '/scan-medicine',
  uploadSingleImage('image'),
  autocompleteController.scanMedicinePhoto.bind(autocompleteController)
);

export { router as autocompleteRouter };
export default router;

