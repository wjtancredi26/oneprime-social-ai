import prisma from "../prisma/client.js";

import {
  buildPostCreateData,
  buildPostUpdateData,
  findAccessiblePost,
  getPostAccessFilter,
  resolveCompanyId,
} from "../services/postService.js";

export async function createPost(req, res) {
  try {
    const companyId = await resolveCompanyId(
      req.user,
      req.body.companyId
    );

    const data = buildPostCreateData({
      body: req.body,
      user: req.user,
      companyId,
    });

    const post =
      await prisma.scheduledPost.create({
        data,
        include: {
          company: true,
        },
      });

    return res.status(201).json({
      success: true,
      post,
    });
  } catch (error) {
    console.error(
      "ERRO AO SALVAR POST:",
      error
    );

    return res.status(400).json({
      success: false,
      error:
        error.message ||
        "Não foi possível salvar o post.",
    });
  }
}

export async function listPosts(req, res) {
  try {
    const where = {
      ...getPostAccessFilter(req.user),
    };

    if (req.query.status) {
      where.status = String(
        req.query.status
      )
        .trim()
        .toUpperCase();
    }

    if (
      req.user.role === "ADMIN" &&
      req.query.companyId
    ) {
      where.companyId = Number(
        req.query.companyId
      );
    }

    const posts =
      await prisma.scheduledPost.findMany({
        where,
        orderBy: {
          scheduledAt: "asc",
        },
        include: {
          company: true,
        },
      });

    return res.json({
      success: true,
      posts,
    });
  } catch (error) {
    console.error(
      "ERRO AO LISTAR POSTS:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        error.message ||
        "Não foi possível listar os posts.",
    });
  }
}

export async function getPostById(req, res) {
  try {
    const post = await findAccessiblePost(
      req.user,
      req.params.id
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        error:
          "Post não encontrado ou acesso não permitido.",
      });
    }

    return res.json({
      success: true,
      post,
    });
  } catch (error) {
    console.error(
      "ERRO AO BUSCAR POST:",
      error
    );

    return res.status(400).json({
      success: false,
      error:
        error.message ||
        "Não foi possível buscar o post.",
    });
  }
}

export async function updatePost(req, res) {
  try {
    const existingPost =
      await findAccessiblePost(
        req.user,
        req.params.id
      );

    if (!existingPost) {
      return res.status(404).json({
        success: false,
        error:
          "Post não encontrado ou acesso não permitido.",
      });
    }

    const data =
      buildPostUpdateData(req.body);

    if (
      req.body.companyId !== undefined
    ) {
      if (req.user.role !== "ADMIN") {
        if (
          Number(req.body.companyId) !==
          Number(req.user.companyId)
        ) {
          return res.status(403).json({
            success: false,
            error:
              "Você não pode transferir o post para outra empresa.",
          });
        }
      }

      data.companyId =
        await resolveCompanyId(
          req.user,
          req.body.companyId
        );
    }

    const post =
      await prisma.scheduledPost.update({
        where: {
          id: existingPost.id,
        },
        data,
        include: {
          company: true,
        },
      });

    return res.json({
      success: true,
      post,
    });
  } catch (error) {
    console.error(
      "ERRO AO EDITAR POST:",
      error
    );

    return res.status(400).json({
      success: false,
      error:
        error.message ||
        "Não foi possível editar o post.",
    });
  }
}

export async function deletePost(req, res) {
  try {
    const existingPost =
      await findAccessiblePost(
        req.user,
        req.params.id
      );

    if (!existingPost) {
      return res.status(404).json({
        success: false,
        error:
          "Post não encontrado ou acesso não permitido.",
      });
    }

    if (
      existingPost.status === "PUBLICANDO"
    ) {
      return res.status(409).json({
        success: false,
        error:
          "Não é possível excluir um post que está sendo publicado.",
      });
    }

    await prisma.scheduledPost.delete({
      where: {
        id: existingPost.id,
      },
    });

    return res.json({
      success: true,
      message:
        "Post excluído com sucesso.",
    });
  } catch (error) {
    console.error(
      "ERRO AO EXCLUIR POST:",
      error
    );

    return res.status(400).json({
      success: false,
      error:
        error.message ||
        "Não foi possível excluir o post.",
    });
  }
}