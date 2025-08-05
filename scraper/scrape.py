import os
import time
import requests
from datetime import datetime, timedelta
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import logging
import re

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# MAIN SCRAPER CLASS FOR ACTUARYLIST WITH PAGINATION SUPPORT
class ActuaryListPaginationScraper:
    def __init__(self, api_base_url="http://localhost:5000/api"):
        self.api_base_url = api_base_url
        self.driver = None
        self.scraped_jobs = []
        self.current_page = 1
        
    # WEBDRIVER SETUP AND CONFIGURATION
    def setup_driver(self):
        options = Options()
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-blink-features=AutomationControlled")
        
        try:
            self.driver = webdriver.Chrome(service=Service("/usr/bin/chromedriver"), options=options)
            self.driver.implicitly_wait(10)
            logger.info("✅ WebDriver setup successful")
            return True
        except Exception as e:
            logger.error(f"❌ WebDriver setup failed: {e}")
            return False
    
    # NAVIGATE TO ACTUARYLIST JOBS PAGE
    def navigate_to_jobs_page(self):
        try:
            url = "https://www.actuarylist.com/"
            logger.info(f"🌐 Navigating to {url}")
            self.driver.get(url)
            
            WebDriverWait(self.driver, 15).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "article"))
            )
            
            time.sleep(3)
            logger.info("✅ Page loaded successfully")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to load page: {e}")
            return False
    
    # GET PAGINATION INFORMATION FROM PAGE
    def get_pagination_info(self):
        try:
            pagination_text = self.driver.find_element(By.CSS_SELECTOR, "nav p.text-sm").text
            logger.info(f"📄 Pagination: {pagination_text}")
            
            match = re.search(r'of\s+(\d+)\s+jobs', pagination_text)
            if match:
                total_jobs = int(match.group(1))
                logger.info(f"📊 Total jobs available: {total_jobs}")
                return total_jobs
            
        except Exception as e:
            logger.warning(f"⚠️ Could not get pagination info: {e}")
        
        return None
    
    # CLICK NEXT BUTTON TO NAVIGATE TO NEXT PAGE
    def click_next_page(self):
        try:
            next_button = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Next')]")
            
            if "disabled" in next_button.get_attribute("class") or not next_button.is_enabled():
                logger.info("📄 Reached last page (Next button disabled)")
                return False
            
            self.driver.execute_script("arguments[0].scrollIntoView(true);", next_button)
            time.sleep(1)
            
            next_button.click()
            logger.info(f"➡️ Clicked Next button, moving to page {self.current_page + 1}")
            
            time.sleep(3)
            
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "article"))
            )
            
            self.current_page += 1
            logger.info(f"✅ Successfully loaded page {self.current_page}")
            return True
            
        except NoSuchElementException:
            logger.info("📄 No Next button found - reached last page")
            return False
        except TimeoutException:
            logger.warning("⚠️ Timeout waiting for next page to load")
            return False
        except Exception as e:
            logger.error(f"❌ Error clicking Next button: {e}")
            return False
    
    # FIND JOB CARD ELEMENTS ON CURRENT PAGE
    def find_job_elements(self):
        try:
            job_elements = self.driver.find_elements(By.CSS_SELECTOR, "article")
            
            if job_elements:
                logger.info(f"✅ Found {len(job_elements)} jobs on page {self.current_page}")
                return job_elements
            else:
                logger.warning(f"⚠️ No job articles found on page {self.current_page}")
                return []
                
        except Exception as e:
            logger.error(f"❌ Error finding job elements: {e}")
            return []
    
    # EXTRACT JOB DATA FROM INDIVIDUAL JOB ELEMENT
    def extract_job_data(self, job_element):
        try:
            job_data = {
                'title': '',
                'company': '',
                'location': '',
                'posting_date': datetime.now().isoformat(),
                'job_type': 'Full-time',
                'tags': [],
                'description': '',
                'url': ''
            }
            
            # EXTRACT COMPANY NAME
            try:
                company_elem = job_element.find_element(By.CSS_SELECTOR, ".Job_job-card__company__7T9qY")
                job_data['company'] = company_elem.text.strip()
            except NoSuchElementException:
                job_data['company'] = "Company Not Found"
            
            # EXTRACT JOB TITLE
            try:
                title_elem = job_element.find_element(By.CSS_SELECTOR, ".Job_job-card__position__ic1rc")
                title_text = title_elem.text.strip()
                title_text = title_text.replace("Featured", "").strip()
                job_data['title'] = title_text
            except NoSuchElementException:
                job_data['title'] = "Position Not Found"
            
            # EXTRACT LOCATIONS
            try:
                location_elements = job_element.find_elements(By.CSS_SELECTOR, ".Job_job-card__location__bq7jX")
                locations = [elem.text.strip() for elem in location_elements if elem.text.strip()]
                if locations:
                    job_data['location'] = ", ".join(locations[:3])
                else:
                    job_data['location'] = "Location Not Specified"
            except NoSuchElementException:
                job_data['location'] = "Location Not Found"
            
            # EXTRACT SALARY INFORMATION
            try:
                salary_elem = job_element.find_element(By.CSS_SELECTOR, ".Job_job-card__salary__QZswp")
                salary_text = salary_elem.text.strip()
                job_data['description'] = f"Salary: {salary_text}"
            except NoSuchElementException:
                job_data['description'] = "Salary information not available"
            
            # EXTRACT TAGS AND SKILLS
            try:
                tag_elements = job_element.find_elements(By.CSS_SELECTOR, ".Job_job-card__tags__zfriA a")
                tags = [elem.text.strip() for elem in tag_elements if elem.text.strip()]
                job_data['tags'] = tags[:8]
            except NoSuchElementException:
                job_data['tags'] = []
            
            # EXTRACT POSTING DATE
            try:
                date_elem = job_element.find_element(By.CSS_SELECTOR, ".Job_job-card__posted-on__NCZaJ")
                date_text = date_elem.text.strip()
                job_data['posting_date'] = self.parse_date(date_text)
            except NoSuchElementException:
                job_data['posting_date'] = datetime.now().isoformat()
            
            # EXTRACT JOB URL
            try:
                url_elem = job_element.find_element(By.CSS_SELECTOR, ".Job_job-page-link__a5I5g")
                href = url_elem.get_attribute('href')
                if href:
                    if href.startswith('/'):
                        job_data['url'] = f"https://www.actuarylist.com{href}"
                    else:
                        job_data['url'] = href
            except NoSuchElementException:
                job_data['url'] = ""
            
            # VALIDATE REQUIRED FIELDS
            if not job_data['title'] or not job_data['company']:
                return None
            
            return job_data
            
        except Exception as e:
            logger.error(f"❌ Error extracting job data: {e}")
            return None
    
    # PARSE ACTUARYLIST DATE FORMAT
    def parse_date(self, date_text):
        try:
            date_text = date_text.lower().strip()
            
            if 'today' in date_text or 'just posted' in date_text:
                return datetime.now().isoformat()
            elif 'yesterday' in date_text:
                return (datetime.now() - timedelta(days=1)).isoformat()
            
            match = re.search(r'(\d+)([hdwm])', date_text)
            if match:
                amount = int(match.group(1))
                unit = match.group(2)
                
                if unit == 'h':
                    return (datetime.now() - timedelta(hours=amount)).isoformat()
                elif unit == 'd':
                    return (datetime.now() - timedelta(days=amount)).isoformat()
                elif unit == 'w':
                    return (datetime.now() - timedelta(weeks=amount)).isoformat()
                elif unit == 'm':
                    return (datetime.now() - timedelta(days=amount*30)).isoformat()
            
            return datetime.now().isoformat()
            
        except Exception:
            return datetime.now().isoformat()
    
    # SAVE JOB DATA TO API
    def save_job_to_api(self, job_data):
        try:
            response = requests.post(f"{self.api_base_url}/jobs", json=job_data, timeout=10)
            
            if response.status_code == 201:
                return True
            elif response.status_code == 409:
                return True
            else:
                logger.error(f"❌ API error {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"❌ API request failed: {e}")
            return False
    
    # MAIN SCRAPING METHOD WITH PAGINATION SUPPORT
    def scrape_jobs_with_pagination(self, target_jobs=200, max_pages=10):
        logger.info(f"🚀 Starting ActuaryList scraping with pagination...")
        logger.info(f"🎯 Target: {target_jobs} jobs, Max pages: {max_pages}")
        
        # TEST API CONNECTION
        try:
            response = requests.get(f"{self.api_base_url}/health", timeout=5)
            if response.status_code != 200:
                logger.error("❌ API not responding")
                return False
        except:
            logger.error("❌ Cannot connect to API")
            return False
        
        if not self.setup_driver():
            return False
        
        try:
            if not self.navigate_to_jobs_page():
                return False
            
            total_available = self.get_pagination_info()
            if total_available:
                logger.info(f"📊 Total jobs available on site: {total_available}")
            
            successful = 0
            failed = 0
            pages_scraped = 0
            
            # MAIN PAGINATION LOOP
            while pages_scraped < max_pages and successful < target_jobs:
                logger.info(f"📄 Scraping page {self.current_page} (Target: {target_jobs - successful} more jobs)")
                
                job_elements = self.find_job_elements()
                if not job_elements:
                    logger.warning(f"⚠️ No jobs found on page {self.current_page}")
                    break
                
                # PROCESS JOBS ON CURRENT PAGE
                for i, element in enumerate(job_elements):
                    if successful >= target_jobs:
                        logger.info(f"🎯 Reached target of {target_jobs} jobs!")
                        break
                    
                    logger.info(f"🔄 Processing job {successful + 1} (Page {self.current_page}, Job {i+1})")
                    
                    job_data = self.extract_job_data(element)
                    if job_data:
                        if self.save_job_to_api(job_data):
                            successful += 1
                            self.scraped_jobs.append(job_data)
                            logger.info(f"✅ Saved: {job_data['title']} at {job_data['company']} ({successful}/{target_jobs})")
                        else:
                            failed += 1
                    else:
                        failed += 1
                    
                    time.sleep(0.5)
                
                pages_scraped += 1
                
                # NAVIGATE TO NEXT PAGE IF NEEDED
                if successful < target_jobs and pages_scraped < max_pages:
                    logger.info(f"📄 Attempting to go to next page...")
                    if not self.click_next_page():
                        logger.info("📄 No more pages available")
                        break
                    time.sleep(2)
                else:
                    break
            
            logger.info(f"🎉 Scraping completed!")
            logger.info(f"📊 Results: {successful} successful, {failed} failed")
            logger.info(f"📄 Pages scraped: {pages_scraped}")
            return successful > 0
            
        except Exception as e:
            logger.error(f"❌ Scraping failed: {e}")
            return False
        finally:
            if self.driver:
                self.driver.quit()
                logger.info("🔒 WebDriver closed")
    
    # GET LIST OF SCRAPED JOBS
    def get_scraped_jobs(self):
        return self.scraped_jobs

# MAIN EXECUTION FUNCTION
def main():
    scraper = ActuaryListPaginationScraper()
    
    print("🤖 ActuaryList Job Scraper with Pagination")
    print("=" * 55)
    
    # GET USER INPUT FOR TARGET JOBS
    try:
        target_jobs = input("How many jobs to scrape? (default: 200): ").strip()
        target_jobs = int(target_jobs) if target_jobs else 200
        target_jobs = min(target_jobs, 500)
    except ValueError:
        target_jobs = 200
    
    # GET USER INPUT FOR MAX PAGES
    try:
        max_pages = input("Maximum pages to scrape? (default: 10): ").strip()
        max_pages = int(max_pages) if max_pages else 10
        max_pages = min(max_pages, 20)
    except ValueError:
        max_pages = 10
    
    print(f"🎯 Scraping up to {target_jobs} jobs from max {max_pages} pages...")
    
    success = scraper.scrape_jobs_with_pagination(target_jobs=target_jobs, max_pages=max_pages)
    
    # DISPLAY RESULTS
    if success:
        jobs = scraper.get_scraped_jobs()
        print(f"\n🎉 SUCCESS! Scraped {len(jobs)} jobs")
        
        if jobs:
            print(f"\n📋 Sample of scraped jobs:")
            for i, job in enumerate(jobs[:5], 1):
                print(f"  {i}. {job['title']}")
                print(f"     Company: {job['company']}")
                print(f"     Location: {job['location']}")
                print(f"     Tags: {', '.join(job['tags'][:3])}...")
                print()
        
        print(f"🔗 Check your frontend: http://localhost:3000")
        print(f"🔗 API endpoint: http://localhost:5000/api/jobs")
        
    else:
        print("\n❌ Scraping failed. Check logs above.")
    
    return success

if __name__ == "__main__":
    main()