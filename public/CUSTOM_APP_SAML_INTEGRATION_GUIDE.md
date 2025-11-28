# Custom App SAML Integration Guide

This guide will help you integrate your custom application with CYNAYD One using SAML 2.0. CYNAYD One acts as the Identity Provider (IdP), and your custom application acts as the Service Provider (SP).

## Overview

When users log into CYNAYD One and access your custom app, CYNAYD will generate a SAML assertion containing user and organization information, which your app can use to authenticate the user automatically.

## Prerequisites

- Your custom application must support SAML 2.0 as a Service Provider
- You need admin access to CYNAYD One to configure SAML
- Your application should have an endpoint to receive SAML assertions (ACS URL)

## Integration Steps

### Step 1: Configure SAML in CYNAYD One

First, configure CYNAYD One to act as an Identity Provider for your organization.

**API Endpoint:**
```
POST https://one.cynayd.com/api/saml/config
```

**Request Headers:**
```
Authorization: Bearer <your-admin-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "entityId": "https://one.cynayd.com/saml",
  "ssoUrl": "https://one.cynayd.com/api/saml/sso",
  "sloUrl": "https://one.cynayd.com/api/saml/slo",
  "certificate": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
  "nameIdFormat": "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
  "signRequests": true,
  "signAssertions": true
}
```

**Details:**
- `entityId`: CYNAYD's unique identifier (use: `https://one.cynayd.com/saml`)
- `ssoUrl`: CYNAYD's SSO endpoint (use: `https://one.cynayd.com/api/saml/sso`)
- `sloUrl`: Single Logout URL (optional)
- `certificate`: X.509 certificate for signing SAML assertions (generate or obtain)
- `nameIdFormat`: Format for user identifier (email address recommended)
- `signRequests`: Enable request signing (recommended: `true`)
- `signAssertions`: Enable assertion signing (recommended: `true`)

### Step 2: Register Your Custom App in CYNAYD

Register your custom application in CYNAYD One and enable SAML.

**API Endpoint:**
```
POST https://one.cynayd.com/api/apps
```

**Request Headers:**
```
Authorization: Bearer <your-admin-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "My Custom App",
  "slug": "my-custom-app",
  "description": "Description of your custom application",
  "url": "https://myapp.example.com",
  "icon": "https://myapp.example.com/icon.png",
  "metadata": {
    "samlEnabled": true,
    "samlConfig": {
      "entityId": "https://myapp.example.com/saml",
      "acsUrl": "https://myapp.example.com/saml/acs",
      "sloUrl": "https://myapp.example.com/saml/slo"
    }
  }
}
```

**Details:**
- `name`: Display name of your app
- `slug`: Unique identifier (URL-friendly, e.g., `my-custom-app`)
- `url`: Your application's base URL
- `metadata.samlEnabled`: Set to `true` to enable SAML
- `metadata.samlConfig.entityId`: Your app's unique SAML identifier
- `metadata.samlConfig.acsUrl`: Your app's Assertion Consumer Service URL (where SAML responses are sent)
- `metadata.samlConfig.sloUrl`: Single Logout URL (optional)

### Step 3: Get CYNAYD IdP Metadata

Download CYNAYD's Identity Provider metadata to configure in your application.

**API Endpoint:**
```
GET https://one.cynayd.com/api/apps/{appSlug}/saml/metadata?organizationId={yourOrgId}
```

**Example:**
```
GET https://one.cynayd.com/api/apps/my-custom-app/saml/metadata?organizationId=org-123
```

**Response:** XML metadata containing:
- Entity ID: `https://one.cynayd.com/saml`
- SSO URL: `https://one.cynayd.com/api/apps/{appSlug}/saml/sso`
- X.509 Certificate for signature validation

**Sample Metadata Structure:**
```xml
<?xml version="1.0"?>
<EntityDescriptor entityID="https://one.cynayd.com/saml">
  <IDPSSODescriptor>
    <SingleSignOnService 
      Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
      Location="https://one.cynayd.com/api/apps/my-custom-app/saml/sso"/>
    <KeyDescriptor use="signing">
      <X509Certificate>...</X509Certificate>
    </KeyDescriptor>
  </IDPSSODescriptor>
</EntityDescriptor>
```

### Step 4: Configure Your Application

Configure your custom application to accept SAML assertions from CYNAYD One.

#### 4.1 Install SAML Library

Choose a SAML library for your technology stack:

**Node.js/Express:**
```bash
npm install samlify passport-saml
```

**Python/Django:**
```bash
pip install python3-saml
```

**PHP:**
```bash
composer require onelogin/php-saml
```

**Java/Spring:**
```xml
<dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-saml2-service-provider</artifactId>
</dependency>
```

#### 4.2 Configure SAML SP in Your App

Configure your application as a Service Provider using CYNAYD's metadata.

**Example (Node.js with samlify):**
```javascript
const samlify = require('samlify');

// Load CYNAYD's IdP metadata
const idp = samlify.IdentityProvider({
  metadata: 'https://one.cynayd.com/api/apps/my-custom-app/saml/metadata?organizationId=org-123'
});

// Configure your app as SP
const sp = samlify.ServiceProvider({
  entityID: 'https://myapp.example.com/saml',
  assertionConsumerService: [{
    binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
    location: 'https://myapp.example.com/saml/acs'
  }]
});
```

**Example (Python with python3-saml):**
```python
from onelogin.saml2.idp_parser import OneLogin_Saml2_IdPMetadataParser
from onelogin.saml2.settings import OneLogin_Saml2_Settings

# Load CYNAYD's IdP metadata
idp_metadata_url = 'https://one.cynayd.com/api/apps/my-custom-app/saml/metadata?organizationId=org-123'
idp_data = OneLogin_Saml2_IdPMetadataParser.parse_remote(idp_metadata_url)

# Configure your app as SP
settings = {
    'sp': {
        'entityId': 'https://myapp.example.com/saml',
        'assertionConsumerService': {
            'url': 'https://myapp.example.com/saml/acs',
            'binding': 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST'
        }
    },
    'idp': idp_data
}
```

#### 4.3 Create ACS Endpoint

Create an endpoint in your application to receive SAML assertions.

**Example (Node.js/Express):**
```javascript
app.post('/saml/acs', async (req, res) => {
  try {
    // Parse SAML response
    const { extract } = await sp.parseLoginResponse(idp, 'post', req);
    
    // Extract user attributes
    const attributes = extract.attributes;
    const userId = attributes.userId;
    const organizationId = attributes.organizationId;
    const email = attributes.email;
    const name = attributes.name;
    const planId = attributes.planId;
    const planName = attributes.planName;
    
    // Create or update user session
    // Store: userId, organizationId, plan information, etc.
    
    // Redirect to your app's dashboard
    res.redirect('/dashboard');
  } catch (error) {
    console.error('SAML validation error:', error);
    res.status(401).send('Authentication failed');
  }
});
```

**Example (Python/Django):**
```python
from django.http import HttpResponseRedirect
from onelogin.saml2.auth import OneLogin_Saml2_Auth

def saml_acs(request):
    auth = OneLogin_Saml2_Auth(request, settings)
    auth.process_response()
    
    if auth.is_authenticated():
        # Extract attributes
        attributes = auth.get_attributes()
        user_id = attributes.get('userId')[0]
        organization_id = attributes.get('organizationId')[0]
        email = attributes.get('email')[0]
        plan_id = attributes.get('planId')[0]
        
        # Create or update user session
        # Store: userId, organizationId, plan information, etc.
        
        return HttpResponseRedirect('/dashboard')
    else:
        return HttpResponse(status=401)
```

### Step 5: SAML Attributes Reference

CYNAYD One sends the following attributes in SAML assertions:

#### User Information
- `userId` (string): Unique user ID in CYNAYD
- `email` (string): User's email address
- `name` (string): User's full name
- `role` (string): User's role (e.g., "user", "admin")
- `department` (string, optional): User's department
- `jobTitle` (string, optional): User's job title

#### Organization Information
- `organizationId` (string): Unique organization ID
- `organizationName` (string): Organization name
- `organizationSlug` (string): Organization slug

#### Plan Information
- `planId` (string): Current plan ID
- `planName` (string): Plan name (e.g., "Professional", "Enterprise")
- `planSlug` (string): Plan slug
- `planDescription` (string): Plan description
- `planFeatures` (string): JSON string of plan features
- `pricingType` (string): Pricing type (e.g., "flat", "per-user")
- `combinedLimits` (string): JSON string of combined limits

#### Plan Limits
- `maxUsers` (string): Maximum number of users allowed
- `maxApps` (string): Maximum number of apps allowed
- `maxStorage` (string): Maximum storage in bytes

#### Subscription Information
- `subscriptionStatus` (string): Subscription status (e.g., "active", "expired")
- `subscriptionPeriodStart` (string): ISO 8601 timestamp of period start
- `subscriptionPeriodEnd` (string): ISO 8601 timestamp of period end

### Step 6: SSO Flow

The complete SSO flow works as follows:

1. **User logs into CYNAYD One**: User authenticates at `https://one.cynayd.com`
2. **User clicks your app**: User selects your custom app from the CYNAYD dashboard
3. **CYNAYD generates SAML assertion**: CYNAYD creates a SAML response with user attributes
4. **Redirect to your app**: User is redirected to your app's ACS URL with SAML response
5. **Your app validates SAML**: Your app validates the SAML signature using CYNAYD's certificate
6. **Extract attributes**: Your app extracts userId, organizationId, plan info, etc.
7. **Create session**: Your app creates/updates user session and logs them in
8. **User accesses your app**: User is now authenticated and can use your app

**Visual Flow:**
```
User → CYNAYD One → [SAML Assertion] → Your App ACS → Dashboard
```

### Step 7: Testing

Test your SAML integration:

1. **Log into CYNAYD One**: `https://one.cynayd.com`
2. **Access your app**: Click on your custom app from the dashboard
3. **Verify redirect**: You should be redirected to your app's ACS URL
4. **Check attributes**: Verify that all required attributes are received
5. **Test session**: Ensure user session is created correctly
6. **Check logs**: Review application logs for SAML validation

### Step 8: Error Handling

Handle common SAML errors:

**Invalid Signature:**
- Verify CYNAYD's certificate is correctly configured
- Ensure certificate hasn't expired
- Check that signature validation is enabled

**Missing Attributes:**
- Verify SAML assertion contains all required attributes
- Check attribute names match exactly (case-sensitive)
- Ensure organization has SAML configured

**Expired Assertion:**
- SAML assertions expire after a short time (typically 5 minutes)
- Implement proper error handling for expired assertions
- Redirect user back to CYNAYD if assertion is expired

**Access Denied:**
- Verify user has access to your app in CYNAYD
- Check organization's plan allows access to your app
- Ensure app is enabled for the organization

## API Endpoints Summary

### CYNAYD One Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `https://one.cynayd.com/api/saml/config` | POST | Configure organization SAML |
| `https://one.cynayd.com/api/apps` | POST | Register custom app |
| `https://one.cynayd.com/api/apps/{slug}/saml/metadata?organizationId={orgId}` | GET | Get IdP metadata |
| `https://one.cynayd.com/api/apps/{slug}/saml/sso` | POST | Initiate SSO (IdP-initiated) |
| `https://one.cynayd.com/api/apps/{slug}/sso-token` | POST | Get JWT SSO token (non-SAML apps) |

### Your Application Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/saml/acs` | POST | Assertion Consumer Service (receives SAML) |
| `/saml/slo` | POST | Single Logout (optional) |

## Security Best Practices

1. **Always validate SAML signatures**: Never trust unsigned assertions
2. **Use HTTPS**: All SAML endpoints must use HTTPS
3. **Validate timestamps**: Check assertion expiration times
4. **Store minimal data**: Only store necessary user information
5. **Implement proper session management**: Use secure, HTTP-only cookies
6. **Log SAML events**: Log all SAML authentication attempts for auditing
7. **Handle errors gracefully**: Don't expose internal errors to users

## Troubleshooting

### Common Issues

**Issue: SAML assertion not received**
- Check ACS URL is correctly configured
- Verify endpoint is accessible from CYNAYD
- Check application logs for incoming requests

**Issue: Signature validation fails**
- Download fresh metadata from CYNAYD
- Verify certificate is correctly loaded
- Check certificate hasn't expired

**Issue: Missing attributes**
- Verify organization has SAML configured
- Check user has access to the app
- Ensure plan information is available

**Issue: User not authenticated**
- Verify SAML response is valid
- Check user session creation logic
- Review application authentication flow

## Support

For additional support:
- **Documentation**: Visit `https://one.cynayd.com/admin/saml-integration`
- **API Docs**: Visit `https://one.cynayd.com/api-docs`
- **Contact**: Reach out to your CYNAYD administrator

## Example Code

### Complete Node.js/Express Example

```javascript
const express = require('express');
const samlify = require('samlify');
const app = express();

// Configure CYNAYD as IdP
const idp = samlify.IdentityProvider({
  metadata: 'https://one.cynayd.com/api/apps/my-custom-app/saml/metadata?organizationId=org-123'
});

// Configure your app as SP
const sp = samlify.ServiceProvider({
  entityID: 'https://myapp.example.com/saml',
  assertionConsumerService: [{
    binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
    location: 'https://myapp.example.com/saml/acs'
  }]
});

// ACS endpoint
app.post('/saml/acs', async (req, res) => {
  try {
    const { extract } = await sp.parseLoginResponse(idp, 'post', req);
    const attributes = extract.attributes;
    
    // Extract required information
    const userData = {
      userId: attributes.userId,
      organizationId: attributes.organizationId,
      email: attributes.email,
      name: attributes.name,
      role: attributes.role,
      planId: attributes.planId,
      planName: attributes.planName,
      maxUsers: parseInt(attributes.maxUsers || '0'),
      maxApps: parseInt(attributes.maxApps || '0'),
      maxStorage: parseInt(attributes.maxStorage || '0'),
      subscriptionStatus: attributes.subscriptionStatus
    };
    
    // Create user session
    // ... your session creation logic ...
    
    res.redirect('/dashboard');
  } catch (error) {
    console.error('SAML error:', error);
    res.status(401).send('Authentication failed');
  }
});

app.listen(3000, () => {
  console.log('App listening on port 3000');
});
```

---

**Last Updated**: 2024
**Version**: 1.0

