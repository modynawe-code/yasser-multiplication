# Data model

The offline prototype keeps aggregate table/fact counters for fast rendering and stores append-like attempt records inside completed sessions.

Core concepts:
- Student (future backend)
- TrainingSession
- Attempt
- MultiplicationFact
- MasteryState
- Exam
- Achievement (future)

Each attempt contains a client-generated ID, fact coordinates, submitted answer, correct answer, correctness, response time and timestamp. A future server must treat raw attempts as the source of truth and derive mastery from them rather than trusting mastery values sent by the client.
