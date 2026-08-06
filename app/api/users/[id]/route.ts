// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";
import bcrypt from "bcryptjs";

// GET - Obtener un usuario específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Solo ADMIN puede ver usuarios
  if (session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "No tienes permisos para ver usuarios" },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;

    const user = await prisma.user.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
      include: {
        permissions: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Ocultar contraseña
    const { password, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    return NextResponse.json(
      { error: "Error al obtener usuario" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar usuario
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Solo ADMIN puede editar usuarios
  if (session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "No tienes permisos para editar usuarios" },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { email, password, name, lastName, phone, role, permissions, isActive } = body;

    // Verificar que el usuario existe
    const existingUser = await prisma.user.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
      include: {
        permissions: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si el email ya está en uso por otro usuario
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: "Ya existe un usuario con ese email" },
          { status: 400 }
        );
      }
    }

    // Preparar datos de actualización
    const updateData: any = {
      email,
      name,
      lastName,
      phone: phone || null,
      role,
      isActive: isActive ?? true,
    };

    // Si se proporciona contraseña, actualizarla
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Actualizar usuario
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        permissions: true,
      },
    });

    // Actualizar permisos
    if (permissions) {
      // Eliminar permisos existentes
      await prisma.permission.deleteMany({
        where: { userId: id },
      });

      // Crear nuevos permisos
      await prisma.permission.createMany({
        data: permissions.map((p: any) => ({
          userId: id,
          module: p.module,
          canCreate: p.canCreate || false,
          canEdit: p.canEdit || false,
          canDelete: p.canDelete || false,
          canApprove: p.canApprove || false,
          canExport: p.canExport || false,
          canPrint: p.canPrint || false,
          canViewCost: p.canViewCost || false,
        })),
      });
    }

    // Obtener usuario actualizado
    const updatedUser = await prisma.user.findUnique({
      where: { id },
      include: {
        permissions: true,
      },
    });

    // Ocultar contraseña
    const { password: _, ...userWithoutPassword } = updatedUser!;

    // Registrar auditoría
    await prisma.audit.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        module: "USERS",
        recordId: user.id,
        before: existingUser,
        after: userWithoutPassword,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    return NextResponse.json(
      { error: "Error al actualizar usuario" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar usuario
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Solo ADMIN puede eliminar usuarios
  if (session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "No tienes permisos para eliminar usuarios" },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;

    // No permitir eliminar a sí mismo
    if (id === session.user.id) {
      return NextResponse.json(
        { error: "No puedes eliminar tu propio usuario" },
        { status: 400 }
      );
    }

    // Verificar que el usuario existe
    const user = await prisma.user.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Eliminar usuario (los permisos se eliminan en cascada)
    await prisma.user.delete({
      where: { id },
    });

    // Registrar auditoría
    await prisma.audit.create({
      data: {
        userId: session.user.id,
        action: "DELETE",
        module: "USERS",
        recordId: id,
        before: user,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({ message: "Usuario eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    return NextResponse.json(
      { error: "Error al eliminar usuario" },
      { status: 500 }
    );
  }
}