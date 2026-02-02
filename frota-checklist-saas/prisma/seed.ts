import { PrismaClient, Role, HandoverStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.create({
    data: {
      name: 'Empresa Demo'
    }
  });

  const adminPassword = await bcrypt.hash('Admin#123', 10);
  const driverPassword = await bcrypt.hash('Driver#123', 10);

  const admin = await prisma.user.create({
    data: {
      orgId: org.id,
      name: 'Admin Principal',
      email: 'admin@empresa.com',
      passwordHash: adminPassword,
      role: Role.ADMIN
    }
  });

  const driver1 = await prisma.user.create({
    data: {
      orgId: org.id,
      name: 'Condutor 1',
      email: 'driver1@empresa.com',
      passwordHash: driverPassword,
      role: Role.DRIVER
    }
  });

  const driver2 = await prisma.user.create({
    data: {
      orgId: org.id,
      name: 'Condutor 2',
      email: 'driver2@empresa.com',
      passwordHash: driverPassword,
      role: Role.DRIVER
    }
  });

  const vehicles = await prisma.vehicle.createMany({
    data: [
      {
        orgId: org.id,
        plate: 'ABC-1234',
        brand: 'Fiat',
        model: 'Strada',
        year: 2022
      },
      {
        orgId: org.id,
        plate: 'DEF-5678',
        brand: 'Volkswagen',
        model: 'Gol',
        year: 2021
      },
      {
        orgId: org.id,
        plate: 'GHI-9012',
        brand: 'Chevrolet',
        model: 'Onix',
        year: 2023
      }
    ]
  });

  const seededVehicles = await prisma.vehicle.findMany({ where: { orgId: org.id } });

  await prisma.handover.createMany({
    data: [
      {
        orgId: org.id,
        vehicleId: seededVehicles[0].id,
        fromUserId: admin.id,
        toUserId: driver2.id,
        status: HandoverStatus.PENDING
      },
      {
        orgId: org.id,
        vehicleId: seededVehicles[1].id,
        fromUserId: admin.id,
        toUserId: driver2.id,
        status: HandoverStatus.PENDING
      }
    ]
  });

  await prisma.accessoryTemplateItem.createMany({
    data: [
      { orgId: org.id, name: 'Triângulo' },
      { orgId: org.id, name: 'Macaco' },
      { orgId: org.id, name: 'Chave de roda' },
      { orgId: org.id, name: 'Estepe' },
      { orgId: org.id, name: 'Tapetes' },
      { orgId: org.id, name: 'Manual/Documento', isOptional: true },
      { orgId: org.id, name: 'Capota marítima / protetor de caçamba', isOptional: true }
    ]
  });

  await prisma.quickCheckItem.createMany({
    data: [
      { orgId: org.id, name: 'Pneus' },
      { orgId: org.id, name: 'Luzes' },
      { orgId: org.id, name: 'Vidros' },
      { orgId: org.id, name: 'Faróis/Lanternas' },
      { orgId: org.id, name: 'Buzina' }
    ]
  });

  console.log('Seed concluído', { orgId: org.id, admin: admin.email, driver1: driver1.email, driver2: driver2.email, vehicles: vehicles.count });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
