import { NextResponse } from 'next/server';

type Props = {
  params: { id: string };
};

export async function GET(req: Request, { params }: Props) {
  // get all the data for the user with the given id
  return NextResponse.json({
    message: 'Get fiilis ',
    id: params.id,
  });
}

export async function POST(req: Request, { params }: Props) {
  // post a new datapoint for the user with the given id
  return NextResponse.json({ message: 'Post fiilis ', id: params.id });
}

export async function PUT(req: Request, { params }: Props) {
  // update the user with the given id
  return NextResponse.json({ message: 'Put fiilis ', id: params.id });
}

export async function DELETE(req: Request, { params }: Props) {
  // delete the user with the given id
  return NextResponse.json({ message: 'Delete fiilis ', id: params.id });
}
