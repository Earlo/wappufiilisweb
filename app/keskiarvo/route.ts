import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
// Initialize DynamoDB Client
const ddbClient = new DynamoDBClient({
  region: process.env.AWS_DEFAULT_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const docClient = DynamoDBDocumentClient.from(ddbClient);

export async function getAverage(day, guild = null) {
  const TableName =
    process.env.DYNAMODB_EVENTS_TABLE_NAME || 'FiilisData_staging';

  const scanParams = {
    TableName,
  };

  try {
    const scanResults = await docClient.send(new ScanCommand(scanParams));

    // Filter items to those matching the day and guild (if specified),
    // and have a non-null score.
    const validItems = scanResults.Items.filter(
      (item) =>
        item.partition_key.startsWith(day) &&
        (guild === null || item.guild === guild) &&
        item.score !== null &&
        !isNaN(item.score),
    );

    if (validItems.length > 0) {
      const totalScore = validItems.reduce(
        (acc, item) => acc + parseInt(item.score, 10),
        0,
      );
      const averageScore = totalScore / validItems.length;
      return averageScore.toFixed(2); // Formats the average score to two decimal places
    } else {
      return 'No valid data available for calculation.';
    }
  } catch (error) {
    console.error('Error scanning table:', error);
    return 'Error calculating average';
  }
}

export async function GET(req, { params }) {
  const day = '2024-03-10'; // Adjust according to your application's needs
  const guild = null; // Or any specific guild name you wish to filter by

  const averageFiilis = await getAverage(day, guild);

  return NextResponse.json({ message: `Get keskiarvo: ${averageFiilis}` });
}
