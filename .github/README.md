# Fleet Management System CI/CD

This directory contains the GitHub Actions workflows for Continuous Integration and Delivery of the Fleet Management System components.

## Workflows

### API Gateway CI

**File:** [api-gateway-ci.yml](./workflows/api-gateway-ci.yml)

This workflow handles the building, testing, and containerization of the API Gateway service:

1. **Trigger**: 
   - Pull requests to `master` or `main` that modify files in `backend/api-gateway/`
   - Pushes to `master` or `main` that modify files in `backend/api-gateway/`

2. **Jobs**:
   - `build`: Builds and tests the API Gateway application
     - Installs Node.js dependencies
     - Runs the linter
     - Builds TypeScript code
     - Runs tests
     - Builds a Docker image (but doesn't push it)
   
   - `push-image`: Builds and pushes the Docker image to GitHub Container Registry
     - Only runs on direct pushes to `master` or `main` (not on PRs)
     - Pushes the image with both `latest` and commit SHA tags

## Container Registry

The Docker images are pushed to GitHub Container Registry (ghcr.io) with the following format:
```
ghcr.io/[OWNER]/fleet-management-[SERVICE]:latest
ghcr.io/[OWNER]/fleet-management-[SERVICE]:[COMMIT-SHA]
```

## Adding a New Service

To add CI/CD for a new microservice:

1. Create a new workflow file in `.github/workflows/`
2. Follow the pattern in `api-gateway-ci.yml`, adjusting paths and names
3. Set up appropriate test and build commands
4. Ensure the Dockerfile is optimized for the specific service
5. Update this README to document the new workflow 