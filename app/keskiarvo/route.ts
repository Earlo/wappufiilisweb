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

async function getAverage(day, guild = null) {
  const TableName =
    process.env.DYNAMODB_EVENTS_TABLE_NAME || 'FiilisData_staging';

  // Calculate start and end of the day timestamps in seconds
  const startOfDay = new Date(day + 'T00:00:00Z').getTime() / 1000;
  const endOfDay = new Date(day + 'T23:59:59Z').getTime() / 1000;

  let filterExpression = '#ts BETWEEN :startOfDay AND :endOfDay';
  const expressionAttributeNames = { '#ts': 'timestamp' }; // Substitute 'timestamp' with '#ts'
  const expressionAttributeValues = {
    ':startOfDay': startOfDay,
    ':endOfDay': endOfDay,
  };

  if (guild) {
    // If a guild is specified, add it to the filter expression
    filterExpression += ' AND guild = :guild';
    expressionAttributeValues[':guild'] = guild;
  }

  try {
    const params = {
      TableName,
      FilterExpression: filterExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    };

    const { Items } = await docClient.send(new ScanCommand(params));
    const scores = Items.filter((item) => item.score !== null)
      .map((item) => parseInt(item.score, 10))
      .filter((score) => !isNaN(score));

    if (scores.length > 0) {
      const averageScore =
        scores.reduce((acc, score) => acc + score, 0) / scores.length;
      return averageScore.toFixed(2); // Return the average as a string formatted to two decimal places
    }
    return 'No valid data available for calculation.';
  } catch (error) {
    console.error('Error scanning table:', error);
    return 'Error calculating average';
  }
}

export async function GET(req, { params }) {
  const day = '2024-03-10'; // Example usage; adjust as needed
  const guild = null; // Or specify a guild

  const averageFiilis = await getAverage(day, guild);

  return NextResponse.json({ message: `Get keskiarvo: ${averageFiilis}` });
}
