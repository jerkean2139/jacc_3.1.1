# Replit Deployment Port Configuration Fix

## Problem Identified:
Your `.replit` file has multiple port configurations which is causing deployment failures:

```
[[ports]]
localPort = 3000
externalPort = 3000

[[ports]]
localPort = 5000
externalPort = 80

[[ports]]
localPort = 24678
externalPort = 3001
```

## Issue:
According to Replit documentation, "Autoscale and Reserved VM deployments only support a single external port being exposed."

## Solution:
Your app runs on port 5000 and should only expose that port. Remove the other port configurations.

The correct configuration should be:
```
[[ports]]
localPort = 5000
externalPort = 80
```

## Steps to Fix:
1. Open your `.replit` file
2. Remove the port configurations for 3000 and 24678
3. Keep only the 5000 → 80 mapping
4. Try deployment again

This single port configuration will resolve the deployment failures you've been experiencing.