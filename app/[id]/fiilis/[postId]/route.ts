import { NextResponse } from 'next/server';

type Props = {
  params: { id: string; postId: string };
};

export async function GET(req: Request, { params }: Props) {
  // get specific fiilis for the user with the given id
  return NextResponse.json({
    message: 'Get fiilis ',
    id: params.id,
    postId: params.postId,
  });
}

export async function PATCH(req: Request, { params }: Props) {
  // update the fiilis with the given id
  return NextResponse.json({
    message: 'Patch fiilis ',
    id: params.id,
    postId: params.postId,
  });
}
