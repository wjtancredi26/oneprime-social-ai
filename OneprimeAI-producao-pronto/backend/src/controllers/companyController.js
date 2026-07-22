import prisma from "../prisma/client.js";

function parseCompanyId(value) {
  const companyId = Number(value);

  if (!Number.isInteger(companyId) || companyId <= 0) {
    throw new Error("Empresa inválida.");
  }

  return companyId;
}

function buildCompanyData(body = {}) {
  const name = String(body.name || "").trim();

  if (!name) {
    throw new Error("O nome da empresa é obrigatório.");
  }

  return {
    name,
    cnpj: body.cnpj ? String(body.cnpj).trim() : null,
    segment: String(body.segment || "").trim(),
    logoUrl: String(body.logoUrl || "").trim(),
    whatsapp: String(body.whatsapp || "").trim(),
    instagram: String(body.instagram || "").trim(),
    facebook: String(body.facebook || "").trim(),
    website: String(body.website || "").trim(),
    tone: String(body.tone || "").trim(),
    colors: String(body.colors || "").trim(),
    products: String(body.products || "").trim(),
    brands: String(body.brands || "").trim(),
    ctas: String(body.ctas || "").trim(),
  };
}

export async function listCompanies(req, res) {
  try {
    const where =
      req.user.role === "ADMIN"
        ? {}
        : {
            id: Number(req.user.companyId),
          };

    const companies = await prisma.company.findMany({
      where,
      orderBy: {
        createdAt: "asc",
      },
    });

    return res.json({
      success: true,
      companies,
    });
  } catch (error) {
    console.error("ERRO AO LISTAR EMPRESAS:", error);

    return res.status(500).json({
      success: false,
      error:
        error.message ||
        "Não foi possível carregar as empresas.",
    });
  }
}

export async function createCompany(req, res) {
  try {
    const data = buildCompanyData(req.body);

    const company = await prisma.company.create({
      data,
    });

    return res.status(201).json({
      success: true,
      company,
    });
  } catch (error) {
    console.error("ERRO AO CRIAR EMPRESA:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        error: "Já existe uma empresa com este CNPJ.",
      });
    }

    return res.status(400).json({
      success: false,
      error:
        error.message ||
        "Não foi possível criar a empresa.",
    });
  }
}

export async function updateCompany(req, res) {
  try {
    const companyId = parseCompanyId(req.params.id);
    const data = buildCompanyData(req.body);

    const existingCompany =
      await prisma.company.findUnique({
        where: {
          id: companyId,
        },
        select: {
          id: true,
        },
      });

    if (!existingCompany) {
      return res.status(404).json({
        success: false,
        error: "Empresa não encontrada.",
      });
    }

    const company = await prisma.company.update({
      where: {
        id: companyId,
      },
      data,
    });

    return res.json({
      success: true,
      company,
    });
  } catch (error) {
    console.error("ERRO AO ATUALIZAR EMPRESA:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        error: "Já existe uma empresa com este CNPJ.",
      });
    }

    return res.status(400).json({
      success: false,
      error:
        error.message ||
        "Não foi possível atualizar a empresa.",
    });
  }
}

export async function deleteCompany(req, res) {
  try {
    const companyId = parseCompanyId(req.params.id);

    const existingCompany =
      await prisma.company.findUnique({
        where: {
          id: companyId,
        },
        select: {
          id: true,
          _count: {
            select: {
              users: true,
              posts: true,
              socialConnections: true,
            },
          },
        },
      });

    if (!existingCompany) {
      return res.status(404).json({
        success: false,
        error: "Empresa não encontrada.",
      });
    }

    const hasRelatedData =
      existingCompany._count.users > 0 ||
      existingCompany._count.posts > 0 ||
      existingCompany._count.socialConnections > 0;

    if (hasRelatedData) {
      return res.status(409).json({
        success: false,
        error:
          "Não é possível excluir esta empresa porque ela possui usuários, posts ou redes sociais vinculadas.",
      });
    }

    await prisma.company.delete({
      where: {
        id: companyId,
      },
    });

    return res.json({
      success: true,
      message: "Empresa excluída com sucesso.",
    });
  } catch (error) {
    console.error("ERRO AO EXCLUIR EMPRESA:", error);

    return res.status(400).json({
      success: false,
      error:
        error.message ||
        "Não foi possível excluir a empresa.",
    });
  }
}