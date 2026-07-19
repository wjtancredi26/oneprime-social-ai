import express from "express";

import {
  listCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
} from "../controllers/companyController.js";

import {
  authenticate,
  requireAdmin,
} from "../middlewares/auth.js";

const router = express.Router();

router.use(authenticate);

/*
 * ADMIN verá todas as empresas.
 * CLIENT deverá receber somente a própria empresa.
 *
 * O filtro será adicionado no companyController.
 */
router.get("/", listCompanies);

/*
 * Apenas administradores podem criar,
 * editar ou excluir empresas.
 */
router.post(
  "/",
  requireAdmin,
  createCompany
);

router.put(
  "/:id",
  requireAdmin,
  updateCompany
);

router.delete(
  "/:id",
  requireAdmin,
  deleteCompany
);

export default router;