import express from "express";
import prisma from "../prisma/client.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

router.use(authenticate);

function parseCompanyId(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const companyId = Number(value);

  if (!Number.isInteger(companyId) || companyId <= 0) {
    throw new Error("Empresa inválida.");
  }

  return companyId;
}

function getPostScope(user, requestedCompanyId) {
  /*
   * Usuário vinculado a uma empresa só pode consultar
   * dados dessa empresa.
   */
  if (user.companyId) {
    if (
      requestedCompanyId &&
      requestedCompanyId !== Number(user.companyId)
    ) {
      throw new Error(
        "Você não possui acesso aos dados desta empresa."
      );
    }

    return {
      companyId: Number(user.companyId),
    };
  }

  /*
   * Administradores sem empresa vinculada podem consultar
   * uma empresa específica ou visualizar o painel geral.
   */
  if (requestedCompanyId) {
    return {
      companyId: requestedCompanyId,
    };
  }

  return {};
}

function getStartOfTodayInSaoPaulo() {
  /*
   * São Paulo atualmente opera em UTC-3.
   * Criamos o início do dia brasileiro convertido para UTC.
   */
  const now = new Date();

  const saoPauloDate = new Date(
    now.toLocaleString("en-US", {
      timeZone: "America/Sao_Paulo",
    })
  );

  const startLocal = new Date(
    saoPauloDate.getFullYear(),
    saoPauloDate.getMonth(),
    saoPauloDate.getDate(),
    0,
    0,
    0,
    0
  );

  const difference = now.getTime() - saoPauloDate.getTime();

  return new Date(startLocal.getTime() + difference);
}

router.get("/", async (req, res) => {
  try {
    const requestedCompanyId = parseCompanyId(
      req.query.companyId
    );

    const postScope = getPostScope(
      req.user,
      requestedCompanyId
    );

    const companyScope = postScope.companyId
      ? {
          id: postScope.companyId,
        }
      : {};

    const connectionScope = postScope.companyId
      ? {
          companyId: postScope.companyId,
        }
      : {};

    const startOfToday = getStartOfTodayInSaoPaulo();

    const [
      scheduled,
      publishing,
      published,
      publishedToday,
      errors,
      companies,
      upcoming,
      recent,
      connections,
    ] = await Promise.all([
      prisma.scheduledPost.count({
        where: {
          ...postScope,
          status: "AGENDADO",
        },
      }),

      prisma.scheduledPost.count({
        where: {
          ...postScope,
          status: "PUBLICANDO",
        },
      }),

      prisma.scheduledPost.count({
        where: {
          ...postScope,
          status: "PUBLICADO",
        },
      }),

      prisma.scheduledPost.count({
        where: {
          ...postScope,
          status: "PUBLICADO",
          publishedAt: {
            gte: startOfToday,
          },
        },
      }),

      prisma.scheduledPost.count({
        where: {
          ...postScope,
          status: "ERRO",
        },
      }),

      prisma.company.count({
        where: companyScope,
      }),

      prisma.scheduledPost.findMany({
        where: {
          ...postScope,
          status: "AGENDADO",
          scheduledAt: {
            gte: new Date(),
          },
        },
        take: 5,
        orderBy: {
          scheduledAt: "asc",
        },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
            },
          },
        },
      }),

      prisma.scheduledPost.findMany({
        where: {
          ...postScope,
          status: {
            in: ["PUBLICADO", "ERRO"],
          },
        },
        take: 5,
        orderBy: {
          updatedAt: "desc",
        },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
            },
          },
        },
      }),

      prisma.socialConnection.findMany({
        where: connectionScope,
        orderBy: {
          updatedAt: "desc",
        },
        select: {
          id: true,
          companyId: true,
          provider: true,
          status: true,
          facebookPageId: true,
          facebookPageName: true,
          instagramUserId: true,
          instagramUsername: true,
          tokenExpiresAt: true,
          connectedAt: true,
          updatedAt: true,
          lastError: true,
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ]);

    const connectedFacebook = connections.filter(
      (connection) =>
        connection.status === "CONNECTED" &&
        Boolean(connection.facebookPageId)
    ).length;

    const connectedInstagram = connections.filter(
      (connection) =>
        connection.status === "CONNECTED" &&
        Boolean(connection.instagramUserId)
    ).length;

    return res.json({
      success: true,

      stats: {
        scheduled,
        publishing,
        published,
        publishedToday,
        errors,
        companies,
      },

      social: {
        facebookConnected: connectedFacebook,
        instagramConnected: connectedInstagram,
        totalConnections: connections.length,
      },

      upcoming,
      recent,
      connections,
    });
  } catch (error) {
    console.error("ERRO AO CARREGAR DASHBOARD:", error);

    return res.status(400).json({
      success: false,
      error:
        error.message ||
        "Não foi possível carregar o Dashboard.",
    });
  }
});

export default router;