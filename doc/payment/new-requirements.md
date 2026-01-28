<!-- Here is our old documentation about this project payment: #
you need to change it based on our new requirements.  -->

most of the doc it Good, Platform, Service & Total Admin Commission will be same style.
But we have changed our plan a little. it will change in the implementations

Here how it will work from now.

1. when deposit:

- From backend I will send a link to deposit so that from my flutter they should not open stripe UI from app, instead from backend they will get a season or link and with that they can open it on a default browser and can add money!

- the money will be in the stripe and users wallet will be updated.

2.  Offer accepted/rejected

- Accepting Offers: job status will update and the wallet will will be update but the we are no longer will work as escrow-based based instead I will simply update the wallet, we will simple cut Customer money from the wallet (db model) and increase it to the Admin account. no real money will be transfer
- Rejecting Offers: if Contractor reject it then also it will simple do to opposite, from admin account we will cut the money and same way Contractor will get his money with platform fee and service free because they did't do any work.
- Automatic Expiration: this will be a cron job and will check Expiration and do money update also.

3. Project Complete or cancel.

- on cancel:
- Full refund to customer if offer exists just like previously it will just cut and increase money.

- on complete
- in this time it will be requested to admin and, admin will see that in the admin dashboard. from there admin will approve it and just like deposit he will simply open stripe UI and transfer real money to that customer.

Note:
we are trying to do as less as possible to do real money transfer. stripe will work as like our bank and via the wallet we will track all of our money and complete our transaction.
