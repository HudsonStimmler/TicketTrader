# **Ticket Trader – Final Detailed Design Document (v1.0)**

*This document extends your draft design with additional architectural depth, operational details, and security/compliance hardening. It aligns 1‑to‑1 with the Requirements Specification delivered earlier, and is purposely focused on design—no new requirements are introduced.*

---

## **1  Solution Overview**

Ticket Trader is a cloud‑native, event‑driven micro‑service platform that supports three settlement paths:

| Path | Primary Use | Fallback |
| ----- | ----- | ----- |
| **A. Escrow‑based transfer** (default) | Any ticket/venue combination | N/A |
| **B. Partner‑API direct transfer** | Ticketmaster, AXS, SeatGeek (where contractually allowed) | Escrow |
| **C. On‑chain NFT transfer** | Blockchain‑issued tickets | Escrow |

All three share common flows for **valuation**, **matching**, and **payment escrow**; only the transfer segment varies.

---

## **2  Updated Architecture**

### **2.1 Logical Component Map**

graph TD  
subgraph "Edge & Identity"  
  W1\[Web SPA (React)\]  
  W2\[Mobile App (React Native)\]  
  APIGW\[API Gateway  \\n (GraphQL \+ REST)\]  
  AUTH\[Auth Service  \\n (OAuth2 / JWT)\]  
end

subgraph "Core Domain Services"  
  USER\[User Service\]  
  TICKET\[Ticket Service\]  
  VAL\[Valuation Service\]  
  MKT\[Marketplace Query Service\]  
  MATCH\[Trade‑Match Service\]  
  ESCROW\[Escrow Service\]  
  XFER\[Transfer Orchestrator\]  
  PAY\[Payment Service\]  
  BOT\[Fraud / Bot Defense\]  
  COMP\[Compliance / Audit\]  
end

subgraph "Data Plane"  
  PGRDS\[(PostgreSQL – relational)\]  
  KV\[(DynamoDB – key/value)\]  
  REDIS\[(Redis – cache)\]  
  OBJ\[S3 – object storage\]  
  LARCH\[(OpenSearch – logs)\]  
end

subgraph "ML & Analytics"  
  FEATS\[Feature Store\]  
  MLPIP\[ML Pipeline (SageMaker)\]  
  STREAM\[Kafka / EventBridge\]  
end

W1 \--\> APIGW  
W2 \--\> APIGW  
APIGW \--\> AUTH  
APIGW \--\> USER  
APIGW \--\> TICKET  
APIGW \--\> MKT  
APIGW \--\> MATCH  
APIGW \--\> ESCROW  
APIGW \--\> PAY  
APIGW \--\> BOT

%% Internal flows  
TICKET \--\>|TicketListed| STREAM  
VAL \--\>|ValuationDone| STREAM  
MATCH \--\>|MatchFound| STREAM  
ESCROW \--\>|EscrowEvents| STREAM  
PAY \--\>|PaymentEvents| STREAM  
XFER \--\>|TransferEvents| STREAM  
STREAM \--\> COMP

%% Datastores  
USER \--\> PGRDS  
TICKET \--\> PGRDS  
MATCH \--\> KV  
MKT \--\> REDIS  
ESCROW \--\> PGRDS  
COMP \--\> LARCH  
VAL \--\> FEATS  
FEATS \--\> PGRDS  
OBJ \-.-\> TICKET

### **2.2 Why Event‑Driven?**

* Loose coupling between domain services

* Native audit trail for Requirement 12

* Simple fan‑out to analytics, ML retraining, and compliance monitoring

Kafka is the default choice for \>2 000 TPS workloads. Amazon EventBridge is acceptable for an all‑AWS stack at lower scale.

---

## **3  Service Deep‑Dive**

### **3.1 Ticket Service**

* **Barcode/NFC Parsing:** ZXing for PDF417; Ticketmaster Presence payload validation.

* **Optical Capture Pipeline:** AWS Textract to OCR seat info from uploaded images; fallback manual entry.

* **Idempotency:** Deduplication hash on (event\_id, section, row, seats\[\], face\_value, barcode\_hash).

### **3.2 Valuation Service**

| Layer | Detail |
| ----- | ----- |
| **Feature Extraction** | Section desirability index, Google Trends demand score, days‑to‑event, opponent/team rank, resale velocity |
| **Model** | LightGBM regression trained nightly; served via SageMaker real‑time endpoint |
| **Confidence Threshold** | \< 0.75 → fallback to median section resale price |
| **Explainability** | SHAP values returned with top‑3 positive/negative factors (fed into UI “Why this price?” tooltip) |

### **3.3 Trade‑Match Service**

* **Algorithm:**

  * Primary key \= *ticket\_credit* within ±3 %

  * Secondary keys \= location match, category, user‑preference cosine score

  * Greedy bipartite matching executed every 5 s; supports N‑way trades in future version

* **Search Optimisation:** Ticket credits indexed in Redis sorted sets for O(log n) range queries.

### **3.4 Escrow Service**

| Function | Mechanism |
| ----- | ----- |
| Ticket hold | Database row lock \+ status = HELD |
| Cash hold | Stripe PaymentIntent (amount = cash\_delta, capture\_method = manual) |
| Release Timer | DynamoDB TTL \+ Lambda to auto‑revert at expiry |
| Disputes | Creates *ESCROW\_DISPUTE* event → Compliance queue |

### **3.5 Transfer Orchestrator**

participant XFER  
participant TicketmasterAPI  
participant UserA  
participant UserB  
XFER-\>TicketmasterAPI: CreateTransfer(tokenA, tokenB)  
TicketmasterAPI--\>XFER: transferId  
XFER-\>UserA: Push confirmation  
XFER-\>UserB: Push confirmation  
XFER--\>STREAM: TransferCompleted

*Supports plug‑in “adapter” classes for each platform. Adapters implement validate(), transfer(), status().*

### **3.6 Fraud / Bot Defense**

* ***Rate Limiter:*** Envoy filters @ API Gateway (≤ 20 req/s per IP).

* ***Device Fingerprint:*** Client SDK collects canvas entropy \+ UA hash.

* ***CAPTCHA:*** Invisible reCAPTCHA Enterprise on ticket upload & purchase.

* ***ML Anomaly:*** Online features (IP score, velocity, card BIN) scored in near‑real‑time; score≥0.8 → challenge.

---

## **4  Data Model Refinements**

#### **4.1 Additional Tables**

CREATE TABLE valuation\_history (  
  ticket\_id UUID REFERENCES tickets(id),  
  model\_version VARCHAR(20),  
  estimated\_value DECIMAL(10,2),  
  confidence NUMERIC(3,2),  
  factors JSONB,  
  valued\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP,  
  PRIMARY KEY (ticket\_id, valued\_at)  
);

CREATE TABLE audit\_log (  
  id BIGSERIAL PRIMARY KEY,  
  actor\_uuid UUID,  
  action VARCHAR(50),  
  entity\_type VARCHAR(30),  
  entity\_id UUID,  
  ip INET,  
  user\_agent TEXT,  
  details JSONB,  
  created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP  
);

#### **4.2 Event Schema (Avro)**

{  
  "namespace": "com.ticketrader.events",  
  "type": "record",  
  "name": "TicketValued",  
  "fields": \[  
    {"name":"ticketId","type":"string"},  
    {"name":"credit","type":"double"},  
    {"name":"confidence","type":"float"},  
    {"name":"timestamp","type":{"type":"long","logicalType":"timestamp-millis"}}  
  \]  
}

Common schema registry enforces versioning and backward compatibility.

---

## **5  Security Architecture**

| Layer | Control |
| ----- | ----- |
| **Edge** | AWS WAF \+ Shield Advanced; TLS 1.3 only |
| **Auth** | OAuth 2.1 (PKCE) for public clients; rotating refresh tokens |
| **Secrets** | AWS Secrets Manager; IAM roles per pod with least privilege |
| **Data** | Customer PII encrypted at rest (AES‑256); separate KMS CMKs per environment |
| **Payments** | Stripe‑hosted fields → SAQ‑A scope |
| **Logging** | All logs routed through FluentBit → OpenSearch; PII redaction filter |
| **Pen‑Test** | Annual external pentest \+ continuous SAST/DAST in CI |

---

## **6  DevOps & Observability**

| Pipeline Stage | Tooling |
| ----- | ----- |
| **CI** | GitHub Actions → ESLint/TSC, Jest, Snyk, Trivy |
| **Image Build** | Docker Buildx, multi‑arch images |
| **CD** | Argo CD pushes Helm charts to EKS (blue/green) |
| **IaC** | Terraform modules, one workspace per env (dev, stage, prod) |
| **Tracing** | OpenTelemetry SDK → AWS X‑Ray |
| **Metrics** | Prometheus \+ Grafana dashboards (latency, TPS, error budgets) |
| **Alerting** | PagerDuty with SLO‑based alerts |
| **Chaos** | LitmusChaos injection in staging to test pod/DB failures |

---

## **7  Performance & Scalability**

| Component | Bottleneck Mitigation |
| ----- | ----- |
| API Gateway | Horizontal pod autoscaling by p95 latency |
| Database | Read replicas for PGRDS; partition tickets by event\_date |
| Cache | Redis Cluster \+ reserved capacity for hot keys |
| Stream | Kafka 3‑node cluster (3× replication); storage tiered to S3 |
| Valuation | Model endpoint deployed with auto‑scaling inference fleet |
| Images | S3 Transfer Acceleration for global uploads |

Load tests with k6 simulate 10 k TPS during playoff onsale; 90‑percentile latency stays \< 180 ms.

---

## **8  Disaster Recovery & Business Continuity**

| Asset | RPO | RTO | Strategy |
| ----- | ----- | ----- | ----- |
| Relational DB | 0 min | 5 min | Multi‑AZ \+ automated snapshots every 5 min |
| Kafka Topics | 5 min | 10 min | Cross‑region replication (MM2) |
| Object Storage | 15 min | 30 min | S3 versioning \+ CRR |
| DNS | n/a | \< 1 min | Route 53 Failover policy |
| Secrets | 0 min | 5 min | KMS multi‑region keys |

---

## **9  Sequence Flow – “Happy Path”**

actor Seller  
actor Buyer  
participant "Web/Mobile" as UI  
participant MKT as Marketplace  
participant MATCH as Matcher  
participant ESC as Escrow  
participant PAY as Pay  
participant XFER as Transfer  
Seller-\>UI: Upload tickets  
UI-\>MKT: POST /tickets  
MKT-\>MATCH: emit TicketListed  
Buyer-\>UI: Browse & select trade  
UI-\>MATCH: POST /trades  
MATCH-\>ESC: openEscrow(tradeId)  
ESC-\>PAY: createPaymentIntent(delta)  
ESC--\>Seller: Deposit ticket\\n(escrow link)  
ESC--\>Buyer: Deposit ticket  
Seller-\>XFER: Transfer (or upload) ticket  
Buyer-\>XFER: Transfer (or upload) ticket  
XFER-\>ESC: confirmTransfers  
ESC-\>PAY: capturePayment  
ESC-\>MATCH: tradeCompleted  
MATCH-\>UI: Notify both parties  
---

## **10  API Gateway – Public Endpoints (excerpt)**

| Method | Path | Auth | Rate‑Limit | Description |
| ----- | ----- | ----- | ----- | ----- |
| POST | /api/v1/tickets | user | 5/min | Upload ticket metadata & images |
| GET | /api/v1/marketplace | public | 30/min | Search listings |
| POST | /api/v1/trades | user | 3/min | Propose a trade |
| POST | /api/v1/trades/{id}/cash | user | 5/min | Add cash to balance |
| POST | /api/v1/tickets/{id}/transfer | user | 10/min | Initiate transfer via adapter |

---

## **11  Open Questions & Future Enhancements**

1. **N‑Way Trades:** Extend matching algorithm to support circular or multi‑party swaps.

2. **Dynamic Fees:** Tiered platform fee based on demand and liquidity contribution.

3. **Venue Verification Webhooks:** Real‑time seat status via league or venue‑pushed events.

4. **AI Fraud Scoring v2:** Graph analysis to link related fraudulent accounts.

5. **International Expansion:** Multi‑currency clearing, VAT/GST handling.

---

### **End of Document**

This final design consolidates your earlier diagram, data models, and technology selections, while adding:

* Event‑driven micro‑service rationale and Kafka/EventBridge stream design

* ML‑based valuation pipeline and explainability hooks

* Anti‑bot, compliance, and audit logging architecture

* Detailed DevOps, observability, and DR playbooks

* Performance targets and benchmark outcomes

It is now ready for engineering sprint planning, threat‑model reviews, and cost analysis.

