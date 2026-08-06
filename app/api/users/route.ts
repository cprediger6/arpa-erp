// app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";
import bcrypt from "bcryptjs";

// GET - Obtener todos los usuarios
export async function GET(request: NextRequest) {
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
    const users = await prisma.user.findMany({
      where: {
        companyId: session.user.companyId,
      },
      include: {
        permissions: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Ocultar contraseñas
    const usersWithoutPassword = users.map(({ password, ...user }) => user);

    return NextResponse.json(usersWithoutPassword);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return NextResponse.json(
      { error: "Error al obtener usuarios" },
      { status: 500 }
    );
  }
}

// POST - Crear un nuevo usuario
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Solo ADMIN puede crear usuarios
  if (session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "No tienes permisos para crear usuarios" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { email, password, name, lastName, phone, role, permissions, isActive } = body;

    // Validaciones
    if (!email || !password || !name || !lastName || !role) {
      return NextResponse.json(
        { error: "Email, contraseña, nombre, apellido y rol son requeridos" },
        { status: 400 }
      );
    }

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Ya existe un usuario con ese email" },
        { status: 400 }
      );
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        lastName,
        phone: phone || null,
        role,
        isActive: isActive ?? true,
        companyId: session.user.companyId,
        permissions: {
          create: permissions?.map((p: any) => ({
            module: p.module,
            canCreate: p.canCreate || false,
            canEdit: p.canEdit || false,
            canDelete: p.canDelete || false,
            canApprove: p.canApprove || false,
            canExport: p.canExport || false,
            canPrint: p.canPrint || false,
            canViewCost: p.canViewCost || false,
          })) || [],
        },
      },
      include: {
        permissions: true,
      },
    });

    // Ocultar contraseña
    const { password: _, ...userWithoutPassword } = user;

    // Registrar auditoría
    await prisma.audit.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        module: "USERS",
        recordId: user.id,
        after: userWithoutPassword,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error("Error al crear usuario:", error);
    return NextResponse.json(
      { error: "Error al crear usuario" },
      { status: 500 }
    );
  }
}