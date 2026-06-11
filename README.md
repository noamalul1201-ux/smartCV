# SmartCV 📄
## AI-Powered CV Analysis Platform on AWS

פלטפורמת ניתוח קורות חיים חכמה המשתמשת בבינה מלאכותית לניתוח קורות חיים ומתן פידבק מפורט.

## תיאור הפרויקט
SmartCV מאפשרת למשתמשים להעלות קורות חיים בפורמט PDF ולקבל ניתוח מפורט הכולל:
- ציון כולל מ-0 עד 100
- חוזקות וחולשות
- טיפים לשיפור
- מילות מפתח חסרות
- ציון התאמה למשרה ספציפית

## ארכיטקטורת AWS
- **Amazon S3** – אחסון קבצי PDF + אירוח Frontend
- **AWS Lambda** – לוגיקה עסקית ועיבוד קבצים
- **Amazon API Gateway** – REST API
- **Amazon DynamoDB** – מסד נתונים
- **Amazon Cognito** – ניהול משתמשים
- **Amazon Bedrock** – ניתוח AI (Claude 3 Haiku)
- **Amazon SES** – שליחת דוחות במייל
- **AWS IAM** – הרשאות
- **Amazon CloudWatch** – ניטור ולוגים

## הוראות התקנה

### דרישות מקדימות
- Node.js 18+
- Python 3.12
- חשבון AWS פעיל
- Git

### התקנת Frontend
```bash
git clone https://github.com/noamalul1201-ux/smartCV.git
cd smartCV
npm install
npm start
```

### הגדרת AWS
1. צור IAM Role בשם `SmartCV-Lambda-Role` עם הרשאות ל-S3, DynamoDB, Bedrock, SES, CloudWatch
2. צור DynamoDB Tables: `smartcv-users` ו-`smartcv-analyses`
3. צור S3 Buckets: `smartcv-resumes` ו-`smartcv-frontend`
4. צור Cognito User Pool בשם `smartcv-user-pool`
5. פרוס את פונקציות Lambda: `smartcv-upload`, `smartcv-analyze`, `smartcv-history`
6. הגדר API Gateway עם endpoints: POST /upload, POST /analyze, GET /history

## API Endpoints
| Method | Endpoint | תיאור |
|---|---|---|
| POST | /upload | העלאת קובץ PDF |
| POST | /analyze | ניתוח קורות חיים |
| GET | /history | היסטוריית ניתוחים |

## טכנולוגיות
- Frontend: React.js
- Backend: Python 3.12
- Cloud: AWS (Serverless)
- AI: Amazon Bedrock (Claude 3 Haiku)
