# ADR-0005 Hosting target: S3 + CloudFront and Lambda; Vercel meanwhile

- **Context:** near-zero-cost hosting is required; the chat backend will need compute.
- **Decision:** target hosting is S3 + CloudFront for the static web and Lambda for
  the API (Function URL / API Gateway), with IaC in `infra/`. Until cutover, deploy v2
  previews on a **second** Vercel project (Root Directory `apps/web`) to avoid touching
  the production project.
- **Consequences:** cheap, scalable. Mandatory before exposing the chat: budget alarm,
  rate limiting and restricted CORS. Cost: two hosting setups during the transition.
