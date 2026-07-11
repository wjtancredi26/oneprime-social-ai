import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function listCompanies(req, res) {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { createdAt: "asc" },
    });

    res.json({ success: true, companies });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function createCompany(req, res) {
  try {
    const company = await prisma.company.create({
      data: {
        name: req.body.name,
        cnpj: req.body.cnpj || null,
        segment: req.body.segment || "",
        logoUrl: req.body.logoUrl || "",
        whatsapp: req.body.whatsapp || "",
        instagram: req.body.instagram || "",
        facebook: req.body.facebook || "",
        website: req.body.website || "",
        tone: req.body.tone || "",
        colors: req.body.colors || "",
        products: req.body.products || "",
        brands: req.body.brands || "",
        ctas: req.body.ctas || "",
      },
    });

    res.json({ success: true, company });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function updateCompany(req, res) {
  try {
    const { id } = req.params;

    const company = await prisma.company.update({
      where: { id: Number(id) },
      data: {
        name: req.body.name,
        cnpj: req.body.cnpj || null,
        segment: req.body.segment || "",
        logoUrl: req.body.logoUrl || "",
        whatsapp: req.body.whatsapp || "",
        instagram: req.body.instagram || "",
        facebook: req.body.facebook || "",
        website: req.body.website || "",
        tone: req.body.tone || "",
        colors: req.body.colors || "",
        products: req.body.products || "",
        brands: req.body.brands || "",
        ctas: req.body.ctas || "",
      },
    });

    res.json({ success: true, company });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function deleteCompany(req, res) {
  try {
    const { id } = req.params;

    await prisma.company.delete({
      where: { id: Number(id) },
    });

    res.json({ success: true, message: "Empresa excluída com sucesso." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}