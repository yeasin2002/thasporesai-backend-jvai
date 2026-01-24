# Files to Delete - Payment Documentation Cleanup

**Date**: January 24, 2026  
**Reason**: Consolidation - content moved to numbered core documents

---

## Files to Delete

### From `doc/payment/MONEY/` folder:

- [ ] `doc/payment/MONEY/2.PAYMENT_SYSTEM_AUDIT.md` - Content merged into 1.SYSTEM_OVERVIEW.md
- [ ] `doc/payment/MONEY/3.MONEY_FLOW_EXPLAINED.md` - Content merged into 1.SYSTEM_OVERVIEW.md
- [ ] `doc/payment/MONEY/4.STRIPE_INTEGRATION_GUIDE.md` - Will be recreated as 4.STRIPE_INTEGRATION.md
- [ ] `doc/payment/MONEY/5.STRIPE_SETUP_WALKTHROUGH.md` - Content will go into 4.STRIPE_INTEGRATION.md
- [ ] `doc/payment/MONEY/OFFER_FLOWS_SUMMARY.md` - Content merged into 1.SYSTEM_OVERVIEW.md
- [ ] `doc/payment/MONEY/OFFER_MODULE_UPDATE.md` - Content merged into 2.BACKEND_IMPLEMENTATION.md

**Keep**: `doc/payment/MONEY/1.jobsphere-payment-readme.md` (main reference document)

### From `doc/payment/IMPLEMENTATION/` folder:

- [ ] `doc/payment/IMPLEMENTATION/API-DOC-FOR-PAYMENT.md` - Content merged into 3.FRONTEND_API_GUIDE.md
- [ ] `doc/payment/IMPLEMENTATION/FRONTEND_API_DOCUMENTATION.md` - Content merged into 3.FRONTEND_API_GUIDE.md
- [ ] `doc/payment/IMPLEMENTATION/IMPLEMENTATION_FIXES_SUMMARY.md` - Outdated, no longer needed
- [ ] `doc/payment/IMPLEMENTATION/POSTMAN_COLLECTION_GUIDE.md` - Replaced by OpenAPI docs
- [ ] `doc/payment/IMPLEMENTATION/QUICK_START_GUIDE.md` - Content merged into 3.FRONTEND_API_GUIDE.md

### From `doc/payment/WEBHOOK.md/` folder:

- [ ] `doc/payment/WEBHOOK.md/STRIPE_DASHBOARD_SETUP.md` - Will go into 4.STRIPE_INTEGRATION.md
- [ ] `doc/payment/WEBHOOK.md/STRIPE_WEBHOOK_GUIDE.md` - Will go into 4.STRIPE_INTEGRATION.md
- [ ] `doc/payment/WEBHOOK.md/WEBHOOK_FLOW_DIAGRAM.md` - Will go into 4.STRIPE_INTEGRATION.md
- [ ] `doc/payment/WEBHOOK.md/WEBHOOK_QUICK_START.md` - Will go into 4.STRIPE_INTEGRATION.md

### From `doc/payment/` root folder:

- [ ] `doc/payment/API_DESIGN.md` - Content merged into 1.SYSTEM_OVERVIEW.md and 2.BACKEND_IMPLEMENTATION.md
- [ ] `doc/payment/ARCHITECTURE.md` - Content merged into 1.SYSTEM_OVERVIEW.md
- [ ] `doc/payment/CANCEL_OFFER_TESTING.md` - Will go into 5.TESTING_GUIDE.md
- [ ] `doc/payment/DATABASE_SCHEMA.md` - Content merged into 2.BACKEND_IMPLEMENTATION.md
- [ ] `doc/payment/FLOW.md` - Content merged into 1.SYSTEM_OVERVIEW.md
- [ ] `doc/payment/IMPLEMENTATION_CHECKLIST.md` - Content merged into 2.BACKEND_IMPLEMENTATION.md
- [ ] `doc/payment/IMPLEMENTATION_GUIDE.md` - Content merged into 2.BACKEND_IMPLEMENTATION.md
- [ ] `doc/payment/INTEGRATION_GUIDE.md` - Content merged into 2.BACKEND_IMPLEMENTATION.md
- [ ] `doc/payment/JOB_LIFECYCLE.md` - Content merged into 1.SYSTEM_OVERVIEW.md
- [ ] `doc/payment/QUICK_REFERENCE.md` - Content merged into 3.FRONTEND_API_GUIDE.md
- [ ] `doc/payment/README.md` - **REPLACED** with new consolidated README.md
- [ ] `doc/payment/REVISED_FLOW.md` - Content merged into 1.SYSTEM_OVERVIEW.md
- [ ] `doc/payment/STRIPE_INTEGRATION.md` - Will be recreated as 4.STRIPE_INTEGRATION.md

---

## Folders to Delete (after removing files)

After deleting the files above, these folders should be empty and can be removed:

- [ ] `doc/payment/MONEY/` (keep only 1.jobsphere-payment-readme.md, move to root)
- [ ] `doc/payment/IMPLEMENTATION/` (entire folder)
- [ ] `doc/payment/WEBHOOK.md/` (entire folder)

---

## New Structure (After Cleanup)

```
doc/payment/
├── README.md                           # NEW - Navigation and overview
├── 1.SYSTEM_OVERVIEW.md                # NEW - Consolidated overview
├── 2.BACKEND_IMPLEMENTATION.md         # NEW - Backend guide
├── 3.FRONTEND_API_GUIDE.md             # NEW - Frontend guide
├── 4.STRIPE_INTEGRATION.md             # TODO - To be created
├── 5.TESTING_GUIDE.md                  # TODO - To be created
├── 6.PRODUCTION_DEPLOYMENT.md          # TODO - To be created
└── REFERENCE.md                        # MOVED from MONEY/1.jobsphere-payment-readme.md
```

---

## Deletion Commands

### Windows (PowerShell)

```powershell
# Delete MONEY folder files (except main reference)
Remove-Item "doc/payment/MONEY/2.PAYMENT_SYSTEM_AUDIT.md"
Remove-Item "doc/payment/MONEY/3.MONEY_FLOW_EXPLAINED.md"
Remove-Item "doc/payment/MONEY/4.STRIPE_INTEGRATION_GUIDE.md"
Remove-Item "doc/payment/MONEY/5.STRIPE_SETUP_WALKTHROUGH.md"
Remove-Item "doc/payment/MONEY/OFFER_FLOWS_SUMMARY.md"
Remove-Item "doc/payment/MONEY/OFFER_MODULE_UPDATE.md"

# Delete IMPLEMENTATION folder
Remove-Item -Recurse -Force "doc/payment/IMPLEMENTATION"

# Delete WEBHOOK.md folder
Remove-Item -Recurse -Force "doc/payment/WEBHOOK.md"

# Delete root duplicates
Remove-Item "doc/payment/API_DESIGN.md"
Remove-Item "doc/payment/ARCHITECTURE.md"
Remove-Item "doc/payment/CANCEL_OFFER_TESTING.md"
Remove-Item "doc/payment/DATABASE_SCHEMA.md"
Remove-Item "doc/payment/FLOW.md"
Remove-Item "doc/payment/IMPLEMENTATION_CHECKLIST.md"
Remove-Item "doc/payment/IMPLEMENTATION_GUIDE.md"
Remove-Item "doc/payment/INTEGRATION_GUIDE.md"
Remove-Item "doc/payment/JOB_LIFECYCLE.md"
Remove-Item "doc/payment/QUICK_REFERENCE.md"
Remove-Item "doc/payment/REVISED_FLOW.md"
Remove-Item "doc/payment/STRIPE_INTEGRATION.md"



# Remove empty MONEY folder
Remove-Item -Force "doc/payment/MONEY"
```

### Linux/Mac (Bash)

```bash
# Delete MONEY folder files (except main reference)
rm doc/payment/MONEY/2.PAYMENT_SYSTEM_AUDIT.md
rm doc/payment/MONEY/3.MONEY_FLOW_EXPLAINED.md
rm doc/payment/MONEY/4.STRIPE_INTEGRATION_GUIDE.md
rm doc/payment/MONEY/5.STRIPE_SETUP_WALKTHROUGH.md
rm doc/payment/MONEY/OFFER_FLOWS_SUMMARY.md
rm doc/payment/MONEY/OFFER_MODULE_UPDATE.md

# Delete IMPLEMENTATION folder
rm -rf doc/payment/IMPLEMENTATION

# Delete WEBHOOK.md folder
rm -rf doc/payment/WEBHOOK.md

# Delete root duplicates
rm doc/payment/API_DESIGN.md
rm doc/payment/ARCHITECTURE.md
rm doc/payment/CANCEL_OFFER_TESTING.md
rm doc/payment/DATABASE_SCHEMA.md
rm doc/payment/FLOW.md
rm doc/payment/IMPLEMENTATION_CHECKLIST.md
rm doc/payment/IMPLEMENTATION_GUIDE.md
rm doc/payment/INTEGRATION_GUIDE.md
rm doc/payment/JOB_LIFECYCLE.md
rm doc/payment/QUICK_REFERENCE.md
rm doc/payment/REVISED_FLOW.md
rm doc/payment/STRIPE_INTEGRATION.md

# Move reference document
mv doc/payment/MONEY/1.jobsphere-payment-readme.md doc/payment/REFERENCE.md

# Remove empty MONEY folder
rmdir doc/payment/MONEY
```

---

## Verification

After deletion, verify the structure:

```bash
# List payment documentation
ls -la doc/payment/

# Should show:
# - README.md
# - 1.SYSTEM_OVERVIEW.md
# - 2.BACKEND_IMPLEMENTATION.md
# - 3.FRONTEND_API_GUIDE.md
# - REFERENCE.md
# - FILES_TO_DELETE.md (this file - can be deleted after cleanup)
```

---

## Notes

1. **Backup First**: Consider creating a backup before deletion
2. **Git History**: Old content is preserved in git history if needed
3. **Reference Document**: Keep `1.jobsphere-payment-readme.md` as `REFERENCE.md` for historical reference
4. **Future Docs**: Documents 4, 5, and 6 will be created when implementing Stripe

---

**Status**: Ready for cleanup  
**Action Required**: Review and execute deletion commands
