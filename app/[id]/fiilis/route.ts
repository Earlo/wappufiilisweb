import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

// Initialize DynamoDB Document Client
const docClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({
    region: process.env.AWS_DEFAULT_REGION || 'eu-north-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  }),
);

export async function POST(req: Request) {
  // Parse the JSON body from the request
  const body = await req.json();
  const { year, guild, campus, score } = body;

  // Generate a timestamp and a random number for the partition_key
  const timestamp = Math.floor(Date.now() / 1000);
  const rand = Math.floor(Math.random() * 100000);
  console.log('Adding item to DynamoDB:', {
    year,
    guild,
    campus,
    score,
    timestamp,
  });
  try {
    const res = await docClient.send(
      new PutCommand({
        TableName: process.env.DYNAMODB_EVENTS_TABLE_NAME,
        Item: {
          partition_key: `${year}::${guild}::${rand}`,
          year: year,
          guild: guild,
          campus: campus,
          score: score,
          timestamp: timestamp,
        },
      }),
    );
    console.log('Item added to DynamoDB:', res);
    // Return a success response
    return NextResponse.json(
      { message: 'Item added successfully' },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    console.error('Error adding item to DynamoDB:', error);
    // Return an error response
    return NextResponse.json(
      { message: 'Failed to add item' },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }
}
