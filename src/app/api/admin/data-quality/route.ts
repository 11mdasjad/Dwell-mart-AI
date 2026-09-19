import { NextResponse } from 'next/server';
import { getCatalogProvider } from '@/lib/catalog/providers/factory';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const provider = getCatalogProvider();
    const metrics = provider.getMetrics();

    return NextResponse.json({
      success: true,
      data: metrics,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    logger.error('Failed to get catalog quality metrics:', { error: msg });
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const provider = getCatalogProvider();
    logger.info('Admin triggered manual catalog synchronization...');
    const metrics = await provider.sync({ force: true });

    return NextResponse.json({
      success: true,
      message: 'Catalog synchronized successfully',
      data: metrics,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Synchronization failure';
    logger.error('Failed during manual catalog sync:', { error: msg });
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
