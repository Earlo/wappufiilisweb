import { NextResponse } from 'next/server';

type Props = {
  params: {};
};

export async function GET(req: Request, { params }: Props) {
  return NextResponse.json({ message: 'Get kappura ' });
}
