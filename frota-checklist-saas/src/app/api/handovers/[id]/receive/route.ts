import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/guards';
import { receiptSchema, basePhotoTypes } from '@/lib/validation';
import { AttachmentOwnerType, OverallStatus, DamageSeverity, AccessoryAnswerValue } from '@prisma/client';

function buildProtocol() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `HR-${date}-${suffix}`;
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    const payload = receiptSchema.parse(await request.json());

    if (payload.handoverId !== params.id) {
      return NextResponse.json({ error: 'Handover inválido.' }, { status: 400 });
    }

    const requiredTypes = new Set(basePhotoTypes);
    const providedTypes = new Set(payload.basePhotos.map((photo) => photo.basePhotoType));
    for (const type of requiredTypes) {
      if (!providedTypes.has(type)) {
        return NextResponse.json({ error: 'Pacote mínimo de fotos incompleto.' }, { status: 400 });
      }
    }

    const handover = await prisma.handover.findFirst({
      where: {
        id: params.id,
        orgId: session.user.orgId
      },
      include: { receipt: true }
    });

    if (!handover || handover.toUserId !== session.user.id) {
      return NextResponse.json({ error: 'Sem permissão para este handover.' }, { status: 403 });
    }

    if (handover.status === 'COMPLETED' || handover.receipt) {
      return NextResponse.json({ error: 'Handover já finalizado.' }, { status: 400 });
    }

    for (const accessory of payload.accessories) {
      if (
        [AccessoryAnswerValue.FALTANDO, AccessoryAnswerValue.DANIFICADO].includes(accessory.value) &&
        (!accessory.notes || !accessory.notes.trim() || !accessory.attachments?.length)
      ) {
        return NextResponse.json(
          { error: 'Acessório com problema requer comentário e foto.' },
          { status: 400 }
        );
      }
    }

    for (const quick of payload.quickChecks) {
      if (quick.value === 'IRREGULAR' && (!quick.notes || !quick.notes.trim())) {
        return NextResponse.json(
          { error: 'Irregularidade rápida requer comentário.' },
          { status: 400 }
        );
      }
    }

    for (const damage of payload.damages) {
      if (!damage.notes || !damage.notes.trim() || !damage.attachments?.length) {
        return NextResponse.json({ error: 'Avaria requer comentário e foto.' }, { status: 400 });
      }
    }

    const hasAccessoryIssue = payload.accessories.some((item) =>
      [AccessoryAnswerValue.FALTANDO, AccessoryAnswerValue.DANIFICADO].includes(item.value)
    );
    const hasDamages = payload.damages.length > 0;
    const hasCritical = payload.damages.some((item) => item.severity === DamageSeverity.GRAVE);

    const overallStatus: OverallStatus = hasCritical
      ? OverallStatus.CRITICO
      : hasAccessoryIssue || hasDamages
        ? OverallStatus.ATENCAO
        : OverallStatus.OK;

    const protocol = buildProtocol();
    const submittedAt = new Date();

    const result = await prisma.$transaction(async (tx) => {
      const receipt = await tx.receipt.create({
        data: {
          orgId: session.user.orgId,
          handoverId: handover.id,
          receiverUserId: session.user.id,
          odometer: payload.odometer,
          fuelLevel: payload.fuelLevel,
          overallStatus,
          protocol,
          submittedAt
        }
      });

      await tx.handover.update({
        where: { id: handover.id },
        data: {
          status: 'COMPLETED',
          completedAt: submittedAt
        }
      });

      await tx.attachment.createMany({
        data: payload.basePhotos.map((photo) => ({
          orgId: session.user.orgId,
          receiptId: receipt.id,
          ownerType: AttachmentOwnerType.RECEIPT_BASE,
          ownerId: null,
          basePhotoType: photo.basePhotoType,
          filePath: photo.filePath,
          mimeType: photo.mimeType
        }))
      });

      for (const accessory of payload.accessories) {
        const answer = await tx.accessoryAnswer.create({
          data: {
            receiptId: receipt.id,
            itemId: accessory.itemId,
            value: accessory.value,
            notes: accessory.notes
          }
        });

        if (accessory.attachments?.length) {
          await tx.attachment.createMany({
            data: accessory.attachments.map((file) => ({
              orgId: session.user.orgId,
              receiptId: receipt.id,
              ownerType: AttachmentOwnerType.ACCESSORY,
              ownerId: answer.id,
              filePath: file.filePath,
              mimeType: file.mimeType
            }))
          });
        }
      }

      for (const quick of payload.quickChecks) {
        const answer = await tx.quickCheckAnswer.create({
          data: {
            receiptId: receipt.id,
            itemId: quick.itemId,
            value: quick.value,
            notes: quick.notes
          }
        });

        if (quick.attachments?.length) {
          await tx.attachment.createMany({
            data: quick.attachments.map((file) => ({
              orgId: session.user.orgId,
              receiptId: receipt.id,
              ownerType: AttachmentOwnerType.ACCESSORY,
              ownerId: answer.id,
              filePath: file.filePath,
              mimeType: file.mimeType
            }))
          });
        }
      }

      for (const damage of payload.damages) {
        const record = await tx.damage.create({
          data: {
            receiptId: receipt.id,
            type: damage.type,
            location: damage.location,
            severity: damage.severity,
            notes: damage.notes
          }
        });

        await tx.attachment.createMany({
          data: damage.attachments.map((file) => ({
            orgId: session.user.orgId,
            receiptId: receipt.id,
            ownerType: AttachmentOwnerType.DAMAGE,
            ownerId: record.id,
            filePath: file.filePath,
            mimeType: file.mimeType
          }))
        });
      }

      return receipt;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Falha ao registrar recibo.' }, { status: 400 });
  }
}
